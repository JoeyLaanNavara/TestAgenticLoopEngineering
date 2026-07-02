#!/usr/bin/env node
/**
 * check-handoff.mjs — Stop hook (see docs/plan/02-hook-enforced-memory-and-learning.md).
 *
 * ── Assumed Claude Code hook I/O contract (validate interactively before relying on it) ──
 *   • Event: "Stop" (and optionally "SubagentStop").
 *   • INPUT: Claude Code passes a JSON object on **stdin** describing the hook
 *     event (fields such as session_id, transcript_path, hook_event_name,
 *     stop_hook_active, …). This script reads stdin but does NOT require any
 *     particular field — it tolerates empty / non-JSON stdin.
 *   • OUTPUT: to BLOCK stopping, print a JSON object to **stdout**:
 *         { "decision": "block", "reason": "<message shown to the agent>" }
 *     and exit 0. To allow stopping, print nothing (or {}) and exit 0.
 *   • A Stop hook that already ran once sets stop_hook_active=true; we honor that
 *     to avoid infinite block loops (if set, we do not block again).
 *
 * ── Guard ──
 *   Only enforces when the env var AUTO_LOOP is set. In normal interactive
 *   sessions AUTO_LOOP is unset, so this exits 0 silently and never disrupts.
 *
 * ── Rule ──
 *   When AUTO_LOOP is set: if `git status --porcelain packages/core/src/components`
 *   shows changes AND no handoff file under the handoffs dir was modified in the
 *   last 10 minutes, block with a reason asking for a structured-handoff.
 *
 * Never crashes: any internal error → allow stop (exit 0, no block).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const COMPONENTS_PATH = 'packages/core/src/components';
const HANDOFF_DIR = '.claude/skills/structured-handoff/references/handoffs';
const RECENT_MS = 10 * 60 * 1000; // 10 minutes

async function readStdin() {
  if (process.stdin.isTTY) return '';
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  } catch {
    return '';
  }
}

/** True if git shows any uncommitted change under the components path. */
export function componentsDirty() {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '--', COMPONENTS_PATH], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim().length > 0;
  } catch {
    // No git / error → treat as not-dirty so we don't wrongly block.
    return false;
  }
}

/** True if any handoff file was modified within the last `windowMs`. */
export function recentHandoff(windowMs = RECENT_MS, now = Date.now()) {
  let entries;
  try {
    entries = fs.readdirSync(HANDOFF_DIR, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    try {
      const stat = fs.statSync(path.join(HANDOFF_DIR, ent.name));
      if (now - stat.mtimeMs <= windowMs) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/**
 * Decide whether to block. Pure function for testability.
 * @param {object} opts
 * @param {boolean} opts.autoLoop
 * @param {boolean} opts.stopHookActive
 * @param {boolean} opts.dirty
 * @param {boolean} opts.hasRecentHandoff
 * @returns {{decision:'block',reason:string}|null}
 */
export function decide({ autoLoop, stopHookActive, dirty, hasRecentHandoff }) {
  if (!autoLoop) return null;
  if (stopHookActive) return null; // avoid infinite block loop
  if (dirty && !hasRecentHandoff) {
    return {
      decision: 'block',
      reason:
        'Write a structured-handoff (5-field report) before stopping. ' +
        'Component source under packages/core/src/components changed this session ' +
        'but no handoff was written in the last 10 minutes.',
    };
  }
  return null;
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
  (async () => {
    // Read (and tolerate) stdin per the hook contract.
    const raw = await readStdin();
    let payload = {};
    if (raw && raw.trim()) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = {};
      }
    }

    // AUTO_LOOP guard: unset → do nothing.
    if (!process.env.AUTO_LOOP) {
      process.exit(0);
    }

    const stopHookActive = Boolean(payload && payload.stop_hook_active);
    const result = decide({
      autoLoop: true,
      stopHookActive,
      dirty: componentsDirty(),
      hasRecentHandoff: recentHandoff(),
    });

    if (result) {
      process.stdout.write(JSON.stringify(result) + '\n');
    }
    process.exit(0);
  })().catch(() => {
    // Never crash a Stop hook — allow the stop.
    process.exit(0);
  });
}
