# Autonomous Loop Engineering — Implementation Plan

Goal: turn the current StencilJS skill **pipeline** into an **autonomous loop** that can
create *and* bugfix components end-to-end without a human driving each stage.

## Why this is needed

The current skills self-correct within a single stage (run → observe → fix → rerun), but the
*loop* properties are specified only in prose and never actually exercised:

- `structured-handoff` — index and `references/handoffs/` are **empty**; no session has ever
  written or resumed state.
- `stencil-issue-tracker` — **write-only**; Watch Items (the pre-flight feedback path) is empty,
  nothing enforces POST-ERROR logging, so no issue ever gets promoted.
- No global attempt cap, no defined "same error", no rollback on stuck loops.
- The terminal visual gate in `stencil-component-build` is subjective → not autonomously terminable.
- There is **no bugfix loop at all** — every skill is create-oriented.

Autonomy requires three things the pipeline lacks: a **driver** (advances the loop), a
**machine-checkable oracle** (knows when it's truly done), and **bounded termination + rollback**
(stops cleanly instead of thrashing or corrupting state).

## Workstreams

| # | Workstream | File | Unlocks |
|---|------------|------|---------|
| 1 | Git isolation + bounded termination & rollback | [01-git-isolation-and-termination.md](01-git-isolation-and-termination.md) | Safe unattended runs |
| 2 | Hook-enforced memory + learning layers | [02-hook-enforced-memory-and-learning.md](02-hook-enforced-memory-and-learning.md) | State persists & loop self-improves |
| 3 | `design-lint` + objective create gates | [03-design-lint-and-objective-gates.md](03-design-lint-and-objective-gates.md) | Autonomous *create* is terminable |
| 4 | `stencil-bugfix` reproduce-first skill | [04-stencil-bugfix-skill.md](04-stencil-bugfix-skill.md) | Autonomous *bugfix* half |
| 5 | Orchestrator / loop driver | [05-orchestrator-driver.md](05-orchestrator-driver.md) | One autonomous entry point |
| 6 | Run log / observability | [06-run-log-observability.md](06-run-log-observability.md) | Auditable unattended runs |

## Dependency graph

```
1 git isolation + termination ─┐
                               ├─→ 5 orchestrator ─→ 6 run log
2 hooks (memory + learning) ───┤
3 design-lint (create oracle) ─┤
4 stencil-bugfix (bugfix loop)─┘
```

Workstreams 1–4 are independent and can be built in parallel. 5 composes them into a single
driver. 6 is polish layered on the driver.

## Recommended build order

1. **#1 + #2** — safety rails and the dormant memory/learning layers. Highest leverage, least code.
2. **#3** — makes autonomous *create* actually able to declare "done".
3. **#4** — the entirely-missing bugfix loop.
4. **#5** — ties both modes into `/auto-component`.
5. **#6** — observability for unattended operation.

Make-or-break for genuine autonomy: **#1, #3, #4**. Everything else amplifies them.

## Definition of done (whole initiative)

- `/auto-component create <Name> "<spec>"` produces a shippable component (build + specs + e2e +
  design-lint + wrappers all green) with **zero human turns**, on an isolated branch, with a
  handoff and any new issues logged.
- `/auto-component bugfix <name> "<report>"` reproduces the bug as a failing test, fixes it,
  proves the repro green **and** no regressions, keeps the repro test, all unattended.
- A stuck run stops within its attempt budget, rolls back cleanly, and leaves a handoff explaining why.
- Re-running after a previously-seen error triggers a pre-flight Watch Item that prevents the repeat.

## Cross-cutting cleanup (found during audit)

`.claude/commands/build-component.md` is stale and should be reconciled during #5:
- references deprecated `stencil-testing` (should be `stencil-unit-test` + `stencil-e2e-test`)
- uses `.scss` (project convention is `.css` per `CLAUDE.md`)
- references sibling dirs `../component-library-angular` etc. (actual layout is `packages/angular` …)
