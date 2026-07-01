# 06 — Run Log / Observability

**Goal:** every unattended run leaves an audit trail so you can see *what happened and why it
stopped* without having watched it live.

## Problem today

Nothing records the loop's decisions. When an autonomous run stops, there's no way to reconstruct
which stage failed, how many attempts it burned, or which error triggered escalation.

## Design

### A. Structured run log

The orchestrator ([05](05-orchestrator-driver.md)) appends JSONL to
`.claude/loop-logs/<branch>.jsonl`, one line per significant event:

```jsonc
{ "ts": "2026-07-01T13:20:00Z", "stage": "stencil-unit-test", "event": "attempt",
  "n": 2, "errorKey": "TS2345 argument-not-assignable", "result": "fail" }
{ "ts": "...", "stage": "stencil-unit-test", "event": "gate", "result": "pass" }
{ "ts": "...", "stage": "stencil-bugfix", "event": "escalate",
  "reason": "global cap (10) exceeded", "action": "rollback" }
```

Event types: `stage-start`, `attempt`, `gate` (pass/fail), `issue-logged`, `escalate`, `rollback`,
`complete`. `errorKey` reuses the `same-error` normalizer from [01](01-git-isolation-and-termination.md).

### B. Human-readable run summary

At the end (success or blocked), emit `.claude/loop-logs/<branch>.md`: stages run, attempts per
stage, errors seen, final status, branch name, handoff link. This is the "what happened" glance.

### C. Tie-ins

- The **Stop hook** ([02](02-hook-enforced-memory-and-learning.md)) reads the run log to decide
  whether errors went unlogged to the issue-tracker.
- The **handoff** Field 3 (Commands + exit codes) and Field 4 (Issues) can be generated straight
  from the run log instead of by hand — reduces the chance of an incomplete handoff.

## Files to add / change

- New: `scripts/loop/log.mjs` — tiny append helper (`log(stage, event, fields)`).
- New dir: `.claude/loop-logs/` (git-ignored — add to `.gitignore`).
- Edit: orchestrator + skills call `log.mjs` at each event; or the driver wraps stage calls and logs
  centrally (preferred — keeps skills clean).

## Acceptance criteria

- After any run, `.claude/loop-logs/<branch>.jsonl` reconstructs the full attempt/gate/escalation
  timeline.
- A blocked run's `.md` summary names the failing stage, the error key, and the rollback action.
- Handoff Fields 3 & 4 are derivable from the log.

## Effort

~0.5 day. Small helper + wiring; most value comes free once the orchestrator exists.
