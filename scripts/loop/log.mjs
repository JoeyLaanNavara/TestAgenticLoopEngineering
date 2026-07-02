#!/usr/bin/env node
/**
 * log.mjs — tiny JSONL run-log helper for the autonomous loop.
 *
 * See docs/plan/06-run-log-observability.md. Appends one JSON line per
 * significant event to `.claude/loop-logs/<branch>.jsonl`, and can render a
 * human-readable markdown summary.
 *
 * Usage (import):
 *   import { log, summarize } from './log.mjs';
 *   log('stencil-unit-test', 'attempt', { n: 2, errorKey: 'TS2345 ...', result: 'fail' });
 *   const md = summarize();            // current branch
 *
 * CLI:
 *   node log.mjs <stage> <event> ['{"n":2,"result":"fail"}']   # append an event
 *   node log.mjs summarize [branch]                            # write+print .md
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = '.claude/loop-logs';

/** Current git branch, or "nobranch" if unavailable. */
export function currentBranch() {
  try {
    const out = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || 'nobranch';
  } catch {
    return 'nobranch';
  }
}

/** Sanitize a branch name into a safe flat filename stem. */
function safeStem(branch) {
  return String(branch || 'nobranch').replace(/[^\w.-]+/g, '_');
}

function ensureDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    return true;
  } catch (err) {
    process.stderr.write(`log: could not create ${LOG_DIR}: ${err.message}\n`);
    return false;
  }
}

function jsonlPath(branch) {
  return path.join(LOG_DIR, `${safeStem(branch)}.jsonl`);
}

function mdPath(branch) {
  return path.join(LOG_DIR, `${safeStem(branch)}.md`);
}

/**
 * Append one JSONL event line. Never throws — degrades to a stderr note.
 * @param {string} stage
 * @param {string} event  one of stage-start|attempt|gate|issue-logged|escalate|rollback|complete (free-form allowed)
 * @param {object} [fields]
 * @returns {object|null} the written record, or null on failure
 */
export function log(stage, event, fields = {}) {
  const branch = (fields && fields.branch) || currentBranch();
  const record = {
    ts: new Date().toISOString(),
    stage: stage ?? null,
    event: event ?? null,
    ...fields,
  };
  if (!ensureDir()) return null;
  try {
    fs.appendFileSync(jsonlPath(branch), JSON.stringify(record) + '\n');
    return record;
  } catch (err) {
    process.stderr.write(`log: append failed: ${err.message}\n`);
    return null;
  }
}

/**
 * Read + parse a branch's JSONL log. Returns [] if the file is missing.
 * @param {string} [branch]
 * @returns {object[]}
 */
export function readEvents(branch = currentBranch()) {
  const file = jsonlPath(branch);
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const events = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    try {
      events.push(JSON.parse(t));
    } catch {
      /* skip malformed line, keep going */
    }
  }
  return events;
}

/**
 * Build a human-readable markdown summary of a branch's run log.
 * @param {string} [branch]
 * @returns {string} markdown
 */
export function summarize(branch = currentBranch()) {
  const events = readEvents(branch);
  const lines = [];
  lines.push(`# Loop Run Summary — \`${branch}\``);
  lines.push('');

  if (events.length === 0) {
    lines.push(`_No run log found at \`${jsonlPath(branch)}\`._`);
    lines.push('');
    return lines.join('\n');
  }

  const first = events[0];
  const last = events[events.length - 1];
  lines.push(`- **Branch:** \`${branch}\``);
  lines.push(`- **Events:** ${events.length}`);
  if (first.ts) lines.push(`- **Started:** ${first.ts}`);
  if (last.ts) lines.push(`- **Last event:** ${last.ts}`);

  // Final status: prefer an explicit complete/escalate event.
  const completeEv = [...events].reverse().find((e) => e.event === 'complete');
  const escalateEv = [...events].reverse().find((e) => e.event === 'escalate');
  let finalStatus = 'unknown';
  if (completeEv) finalStatus = completeEv.result || 'complete';
  else if (escalateEv) finalStatus = `blocked (${escalateEv.reason || 'escalated'})`;
  lines.push(`- **Final status:** ${finalStatus}`);
  const rollbackEv = [...events].reverse().find((e) => e.event === 'rollback');
  if (rollbackEv) {
    lines.push(`- **Rollback:** ${rollbackEv.action || 'performed'}${rollbackEv.mode ? ` (${rollbackEv.mode})` : ''}`);
  }
  lines.push('');

  // Per-stage attempt tally.
  const stages = new Map();
  for (const e of events) {
    const st = e.stage || '(none)';
    if (!stages.has(st)) stages.set(st, { attempts: 0, gatesPass: 0, gatesFail: 0, events: 0 });
    const rec = stages.get(st);
    rec.events += 1;
    if (e.event === 'attempt') rec.attempts += 1;
    if (e.event === 'gate') {
      if (e.result === 'pass') rec.gatesPass += 1;
      else rec.gatesFail += 1;
    }
  }

  lines.push('## Stages');
  lines.push('');
  lines.push('| Stage | Attempts | Gate pass | Gate fail | Events |');
  lines.push('|-------|---------:|----------:|----------:|-------:|');
  for (const [st, rec] of stages) {
    lines.push(`| ${st} | ${rec.attempts} | ${rec.gatesPass} | ${rec.gatesFail} | ${rec.events} |`);
  }
  lines.push('');

  // Distinct error keys seen.
  const errorKeys = new Map();
  for (const e of events) {
    if (e.errorKey) errorKeys.set(e.errorKey, (errorKeys.get(e.errorKey) || 0) + 1);
  }
  lines.push('## Errors seen');
  lines.push('');
  if (errorKeys.size === 0) {
    lines.push('_None recorded._');
  } else {
    lines.push('| Error key | Count |');
    lines.push('|-----------|------:|');
    for (const [k, n] of errorKeys) lines.push(`| ${k} | ${n} |`);
  }
  lines.push('');

  // Escalation / rollback detail.
  const escalations = events.filter((e) => e.event === 'escalate' || e.event === 'rollback');
  if (escalations.length) {
    lines.push('## Escalations & rollbacks');
    lines.push('');
    for (const e of escalations) {
      lines.push(`- \`${e.ts || ''}\` **${e.event}** — ${e.reason || ''}${e.action ? ` → ${e.action}` : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── CLI ───────────────────────────────────────────────────────────────
function isMain() {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
}

if (isMain()) {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd) {
    process.stderr.write(
      'usage:\n' +
        '  node log.mjs <stage> <event> [jsonFields]\n' +
        '  node log.mjs summarize [branch]\n'
    );
    process.exit(1);
  }

  if (cmd === 'summarize') {
    const branch = rest[0] || currentBranch();
    const md = summarize(branch);
    let wrote = false;
    if (ensureDir()) {
      try {
        fs.writeFileSync(mdPath(branch), md);
        wrote = true;
      } catch (err) {
        process.stderr.write(`log: could not write summary: ${err.message}\n`);
      }
    }
    process.stdout.write(md + '\n');
    if (wrote) process.stderr.write(`\n(wrote ${mdPath(branch)})\n`);
    process.exit(0);
  }

  // Otherwise: append an event. cmd = stage, rest[0] = event, rest[1] = json.
  const stage = cmd;
  const event = rest[0];
  if (!event) {
    process.stderr.write('log: missing <event>\n');
    process.exit(1);
  }
  let fields = {};
  if (rest[1]) {
    try {
      fields = JSON.parse(rest[1]);
    } catch (err) {
      process.stderr.write(`log: jsonFields is not valid JSON: ${err.message}\n`);
      process.exit(1);
    }
  }
  const rec = log(stage, event, fields);
  if (rec) process.stdout.write(JSON.stringify(rec) + '\n');
  process.exit(rec ? 0 : 1);
}
