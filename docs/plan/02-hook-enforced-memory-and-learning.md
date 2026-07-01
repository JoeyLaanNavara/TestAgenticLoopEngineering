# 02 — Hook-Enforced Memory + Learning Layers

**Goal:** make `structured-handoff` and `stencil-issue-tracker` fire **mechanically** instead of on
agent goodwill, so state persists across runs and repeat errors get prevented — closing the loop.

## Problem today

Both skills are specified but dead:
- `structured-handoff/references/HANDOFF_INDEX.md` has zero rows; `references/handoffs/` is empty.
- `stencil-issue-tracker` is write-only: Watch Items is empty, nothing enforces POST-ERROR logging,
  so no issue reaches Recurrence ≥ 2 to be promoted into the pre-flight check.

They're skipped because they rely on the agent remembering. Hooks remove the agent from the
enforcement path.

## How Claude Code hooks actually work (accurate scoping)

Hooks run **shell commands**; they cannot "invoke a skill" directly. What they *can* do:
- **`SessionStart`** — a hook's stdout is injected as additional context. So a script can read the
  latest handoff + Watch Items and *guarantee* the READ happens (this session's own
  "SessionStart hook additional context" is exactly this mechanism).
- **`Stop` / `SubagentStop`** — can inspect state and **block** stopping with a reason, forcing the
  agent to complete an action (e.g. write a handoff) before it can end.
- **`PostToolUse`** (matcher `Bash`) — can observe command outcomes and inject reminders.

So the design is: hooks **guarantee READ** and **force WRITE/log-on-exit**; the actual content is
still produced by the agent (it has the knowledge), but it can no longer skip the step.

## Design

### A. SessionStart hook — guaranteed handoff READ

`scripts/loop/session-context.mjs`:
1. Read newest file in `.claude/skills/structured-handoff/references/handoffs/`.
2. Read the `## Watch Items` section of `stencil-issue-tracker/references/known-issues.md`.
3. Emit a compact context block: "Prior session: done / still-needed / issues to watch."

Wire in `.claude/settings.json`:
```jsonc
"hooks": {
  "SessionStart": [
    { "hooks": [ { "type": "command", "command": "node scripts/loop/session-context.mjs" } ] }
  ]
}
```

### B. Stop hook — forced handoff WRITE

`scripts/loop/check-handoff.mjs`: if this session modified files under `packages/core/src/components/`
but no handoff file was created/updated this session, return a **block** decision:
`{ "decision": "block", "reason": "Write a structured-handoff (5-field report) before stopping." }`
The agent then writes it and stops cleanly on the next attempt.

```jsonc
"Stop": [
  { "hooks": [ { "type": "command", "command": "node scripts/loop/check-handoff.mjs" } ] }
]
```

### C. Enforced issue-tracker POST-ERROR

Two reinforcing mechanisms:
1. **Skill-level (primary):** each pipeline skill's self-correction loop gains a mandatory step —
   "on resolving any error, append/increment it in `known-issues.md` via `stencil-issue-tracker`
   POST-ERROR before continuing." Wording changes from "document if new" (optional) to "must log".
2. **Hook backstop:** the `Stop` hook also checks — if the run log shows resolved errors this
   session but `known-issues.md` was not touched, block with a reminder.

### D. Close the promotion path

`stencil-issue-tracker` already promotes at Recurrence ≥ 2. Once (C) actually increments counters
across runs, the Watch Items section populates, and (A) surfaces it pre-flight — the learning loop
closes with no further code.

## Files to add / change

- New: `scripts/loop/session-context.mjs`, `scripts/loop/check-handoff.mjs`.
- Edit: `.claude/settings.json` — add `hooks` block (keep existing `mcpServers`).
- Edit: each pipeline skill self-correction section — POST-ERROR becomes mandatory.
- Verify hook event names/return-schema against current Claude Code hooks docs before finalizing
  (use the `update-config` skill in an interactive session; hook wiring can't be validated headless).

## Acceptance criteria

- Starting a fresh session auto-prints prior done/still-needed/watch-items with no prompt.
- Ending a session that touched a component without a handoff is **blocked** until one is written.
- Triggering the same build error in two runs promotes it to Watch Items and it's checked pre-flight
  on the third run (recurrence prevention demonstrated).

## Effort

~1 day, incl. validating hook semantics interactively.
