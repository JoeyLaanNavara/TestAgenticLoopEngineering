# 05 — Orchestrator / Loop Driver

**Goal:** one autonomous entry point that owns the state machine and advances the loop without a
human driving each stage — for both create and bugfix modes.

## Problem today

Stage ordering lives in prose ("Do NOT proceed past a failing step") inside `build-component.md`.
Nothing sequences stages autonomously or branches between create/bugfix. The existing command is
also stale (see cleanup below).

## Design

New command `.claude/commands/auto-component.md` (supersedes `build-component.md`):

```
/auto-component create <Name> "<spec>"
/auto-component bugfix <component> "<bug report>"
```

### State machine

```
SessionStart hook → handoff READ + Watch Items (02)
        ↓
create branch auto/<mode>-<component>-<date> (01)
        ↓
stencil-bootstrap ──(gate: 4 checks pass)──┐
        ↓                                   │
  ┌─ mode = create ─────────────────────────┤
  │   stencil-component-build               │  every stage:
  │   → stencil-unit-test                    │   - runs under Loop Budget (01)
  │   → stencil-e2e-test                     │   - logs errors to issue-tracker (02)
  │   → design-lint gate (03)                │   - appends to run log (06)
  │   → storybook-component                  │   - must clear its gate before next
  │   → stencil build (wrappers)             │
  │   → framework-integration-testing        │
  │   → component-library-mcp                 │
  │                                           │
  └─ mode = bugfix ──────────────────────────┤
      stencil-bugfix Phases 1–5 (04)          │
        ↓                                     │
      framework-integration-testing (if API changed)
        ↓
Stop hook → forced handoff WRITE (02)
```

### Responsibilities the driver owns

- **Gate enforcement:** read each stage's machine-checkable success signal; only advance on green.
- **Branch/rollback:** create the isolation branch up front; call rollback on Loop Budget breach.
- **Mode dispatch:** create vs bugfix share bootstrap + wrapper + handoff, differ in the middle.
- **Final report:** emit the status box (reuse the existing `build-component.md` format) with the
  branch name and a pointer to the run log.

## Files to add / change

- New: `.claude/commands/auto-component.md`.
- Deprecate/redirect `.claude/commands/build-component.md` → `auto-component create`.
- **Fix stale references while here** (from audit):
  - `stencil-testing` → `stencil-unit-test` + `stencil-e2e-test`
  - `.scss` → `.css`
  - `../component-library-angular` → `packages/angular` (and react/vue)

## Autonomy note

The command is the deterministic spec of the loop; the agent executes it turn-to-turn. For fully
unattended multi-component runs, the driver can be paired with a background loop
(`/loop` or a scheduled routine) that feeds tasks in and relies on the Stop-hook handoff for
resumability. Keep human-in-the-loop optional, not required.

## Acceptance criteria

- `/auto-component create ds-badge "small status label with variants"` runs bootstrap→…→mcp,
  advancing only on green gates, and ends with a handoff + clean branch — no human turns.
- `/auto-component bugfix ds-card "ignores elevated prop"` dispatches into the bugfix loop.
- A failing gate mid-pipeline halts advancement and triggers escalation/rollback, not a skip.

## Effort

~1 day, plus the stale-reference cleanup.
