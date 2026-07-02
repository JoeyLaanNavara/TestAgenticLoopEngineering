#!/usr/bin/env node
/**
 * session-context.mjs — SessionStart hook (see docs/plan/02-hook-enforced-memory-and-learning.md).
 *
 * A SessionStart hook's stdout is injected into the session as additional
 * context. This script GUARANTEES the "read the prior handoff + watch items"
 * step happens without relying on the agent to remember it.
 *
 * It emits a compact context block:
 *   - Prior session: done / still-needed (from the newest handoff file)
 *   - Issues to watch (from the "## Watch Items" section of known-issues.md)
 *
 * Never crashes: missing dirs/files degrade to a short note.
 *
 * CLI / hook:
 *   node scripts/loop/session-context.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const HANDOFF_DIR = '.claude/skills/structured-handoff/references/handoffs';
const KNOWN_ISSUES = '.claude/skills/stencil-issue-tracker/references/known-issues.md';

/** Return the newest (by mtime) regular file in a dir, or null. */
export function newestFile(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  let best = null;
  let bestMtime = -Infinity;
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const full = path.join(dir, ent.name);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (stat.mtimeMs > bestMtime) {
      bestMtime = stat.mtimeMs;
      best = full;
    }
  }
  return best;
}

/**
 * Extract the "## Watch Items" section body from known-issues.md.
 * Returns the text between the "## Watch Items" heading and the next "## " heading.
 */
export function extractWatchItems(mdText) {
  if (!mdText) return '';
  const lines = mdText.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+Watch Items\s*$/i.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return '';
  const body = [];
  for (let i = start; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break;
    body.push(lines[i]);
  }
  return body.join('\n').trim();
}

/** Pull the 5-field handoff summary lines out of a handoff file (best-effort). */
function summarizeHandoff(text) {
  // Handoffs are freeform markdown; surface the whole thing but trim to a
  // reasonable size so the injected context stays compact.
  const trimmed = text.trim();
  const MAX = 2000;
  if (trimmed.length <= MAX) return trimmed;
  return trimmed.slice(0, MAX) + '\n… [truncated]';
}

/** Build the full context block string. */
export function buildContext() {
  const out = [];
  out.push('=== Autonomous Loop — Session Context ===');
  out.push('');

  // Prior handoff.
  const handoffFile = newestFile(HANDOFF_DIR);
  if (!handoffFile) {
    out.push('Prior session: no prior handoff found (fresh start).');
  } else {
    let text = '';
    try {
      text = fs.readFileSync(handoffFile, 'utf8');
    } catch {
      text = '';
    }
    out.push(`Prior handoff: ${path.basename(handoffFile)}`);
    if (text.trim()) {
      out.push('---');
      out.push(summarizeHandoff(text));
      out.push('---');
    } else {
      out.push('(handoff file is empty)');
    }
  }
  out.push('');

  // Watch items.
  let issuesText = '';
  try {
    issuesText = fs.readFileSync(KNOWN_ISSUES, 'utf8');
  } catch {
    issuesText = '';
  }
  const watch = extractWatchItems(issuesText);
  out.push('Issues to watch (from stencil-issue-tracker):');
  if (!watch || /no watch items yet/i.test(watch)) {
    out.push('  (none yet — no recurring issues promoted)');
  } else {
    for (const l of watch.split(/\r?\n/)) {
      if (l.trim()) out.push('  ' + l);
    }
  }
  out.push('');
  out.push('=========================================');
  return out.join('\n');
}

// ── CLI / hook ─────────────────────────────────────────────────────────
function isMain() {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
}

if (isMain()) {
  try {
    process.stdout.write(buildContext() + '\n');
  } catch (err) {
    // Never crash a SessionStart hook.
    process.stdout.write(`(session-context unavailable: ${err?.message || err})\n`);
  }
  process.exit(0);
}
