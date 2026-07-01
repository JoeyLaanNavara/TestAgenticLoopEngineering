# 04 — `stencil-bugfix` Reproduce-First Skill

**Goal:** add the entirely-missing **bugfix loop**. Autonomy hinges on a *failing test as the
oracle* — the agent can't know a bug is fixed unless "fixed" is defined by a test flipping red→green.

## Problem today

Every skill is create-oriented (`bootstrap → build → test → storybook → mcp`). There is no path for
"this component misbehaves — fix it". Without a reproduction test, an autonomous agent has no
termination signal for a fix.

## Design — the reproduce-first loop

New skill `.claude/skills/stencil-bugfix/SKILL.md`, five phases:

### Phase 1 — Reproduce (the oracle)
- Input: a bug report (free text, GitHub issue, or a failing behavior description).
- Write a **failing** spec (`newSpecPage`) or e2e (Playwright) test that captures the defect.
- **Gate:** the new test must fail *for the expected reason* before any fix is attempted.
  If it can't be made to fail, escalate — the bug isn't reproducible/understood. No repro → stop.

### Phase 2 — Localize
- Pull source + existing tests via the `component-library` MCP tools (`get_component`,
  `get_component_tests`) plus targeted grep. This is exactly what the MCP layer exists for.
- Produce a short hypothesis: file + lines + why.

### Phase 3 — Fix
- Minimal edit to the component under the Loop Budget ([01](01-git-isolation-and-termination.md)).

### Phase 4 — Verify (two gates, both required)
- The repro test now **passes**, **and**
- the full existing suite (`stencil test --spec` + `--e2e`) still passes → **no regressions**.
- Re-run `design-lint` ([03](03-design-lint-and-objective-gates.md)) so the fix doesn't violate DESIGN.md.

### Phase 5 — Guard
- The repro test stays in the suite permanently (regression guard).
- Log the root cause to `stencil-issue-tracker` POST-ERROR ([02](02-hook-enforced-memory-and-learning.md)).
- Write a handoff; if wrappers/behavior changed, note framework-integration re-run.

## Termination / escalation

- Success = Phase 4 both-gates green.
- On Loop Budget breach: roll back the fix (keep the repro test), write a `blocked` handoff with the
  hypothesis and last failure, stop. A kept-but-failing repro test is a *useful* artifact for the
  next run, not corruption.

## Files to add / change

- New: `.claude/skills/stencil-bugfix/SKILL.md` (+ `references/` for repro-test patterns:
  spec vs e2e decision guide, common Stencil failure taxonomy reused from `stencil-e2e-test`).
- Edit: `.claude/skills/component-library-mcp` docs cross-link (localization relies on it).
- Wire as the second orchestrator mode ([05](05-orchestrator-driver.md)).

## Acceptance criteria

- Given a seeded bug (e.g. `ds-card` ignores a prop), the skill writes a test that fails for that
  reason, fixes the component, shows the repro green + full suite green, and keeps the test.
- An unreproducible report is rejected in Phase 1 rather than fixed blindly.
- A fix that breaks another test is caught by the Phase 4 regression gate and does not "complete".

## Effort

~1.5 days. New skill + repro-pattern references; reuses existing test-runner loops.
