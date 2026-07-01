# 01 — Git Isolation + Bounded Termination & Rollback

**Goal:** an unattended run can never damage `main` or spin forever. Every autonomous task runs on
throwaway state, is bounded by a hard attempt budget, and rolls back cleanly when it gives up.

## Problem today

- Skills say "3 attempts on the **same** error" but never define "same error" and set **no global cap**.
  A shifting error message defeats the bound → potential infinite loop.
- No rollback: a failed run can leave a half-written `stencil.config.ts`, an orphaned
  `packages/core/src/components/<tag>/` dir, or dirty generated wrappers for the next run to trip on.

## Design

### A. Isolation

- The orchestrator (see [05](05-orchestrator-driver.md)) creates a branch at task start:
  `auto/<mode>-<component>-<shortdate>` (e.g. `auto/create-ds-badge-0701`).
- Optional stronger isolation: run in a git worktree so the working tree of `main` is untouched
  even mid-run. Use the harness worktree isolation for the agent, or `git worktree add`.
- All edits, builds, and generated wrappers happen on that branch/worktree only.

### B. Bounded termination (define the counters)

Add a shared "Loop Budget" contract, referenced by every pipeline skill:

- **Per-error cap:** ≤3 attempts on the *same* error.
- **"Same error" definition:** the first non-empty `stderr` line, normalized (strip line/col
  numbers and absolute paths). Two errors are "the same" iff normalized first lines match.
- **Global cap:** ≤10 total fix attempts per skill invocation, regardless of error variety.
- **Stage cap for subjective/visual loops:** ≤5 cycles (see [03](03-design-lint-and-objective-gates.md)).

### C. Escalation + rollback

On any cap breach:
1. Capture the last full command output into the run log ([06](06-run-log-observability.md)).
2. Log/append the blocking error to `stencil-issue-tracker` ([02](02-hook-enforced-memory-and-learning.md)).
3. Roll back the stage's changes:
   - create mode → `git restore`/`git clean -fd` the component dir, or drop the worktree;
   - bugfix mode → `git stash`/revert the attempted fix but **keep** the repro test.
4. Write a handoff with status `blocked` and the reason.
5. Exit with a single clear message; never leave partial state on the branch's tip.

## Files to add / change

- `docs/plan/` ← this file.
- New: `scripts/loop/same-error.mjs` — normalizes stderr → stable error key (used by skills & the
  attempt counter). Small, dependency-free.
- New: `scripts/loop/rollback.sh <mode> <component>` — the rollback recipes above.
- Edit each pipeline skill's self-correction section to reference the **Loop Budget** contract and
  the `same-error` key instead of the vague "same error" phrasing.
- Add a short **Loop Budget** reference doc the skills link to (e.g.
  `.claude/skills/_shared/loop-budget.md`).

## Enforcement note

The loop is agent-driven, so the caps live primarily in skill instructions. A **backstop** hook
(see [02](02-hook-enforced-memory-and-learning.md)) can count consecutive identical failing Bash
commands in a session and inject a "budget exceeded — escalate and roll back" reminder, so the cap
is not purely on agent goodwill.

## Acceptance criteria

- A deliberately unfixable component request stops within ≤10 attempts, rolls back, leaves `main`
  and the branch tip clean (`git status` clean except the handoff), and writes a `blocked` handoff.
- No autonomous run ever commits to or mutates `main` directly.
- `same-error.mjs` returns identical keys for the same error with different line numbers/paths.

## Effort

~0.5 day. Mostly scripting + editing skill self-correction sections.
