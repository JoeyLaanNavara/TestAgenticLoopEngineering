---
name: stencil-bugfix
description: Fix a defect in a StencilJS component using a reproduce-first loop, self-correcting under the Loop Budget until the failing test is green and the full suite still passes. Use this skill when a component misbehaves and needs fixing (not when creating a new component). The workflow is reproduce-first — write a FAILING spec or e2e test that captures the defect and use it as the oracle for "fixed", then localize, apply a minimal fix, verify with a two-gate regression check, and keep the repro test permanently as a regression guard. Requires the component name and a bug report (free text, GitHub issue, or a failing-behavior description) as context.
---

# StencilJS Bugfix — Reproduce-First

Fix a component defect the autonomous way: a **failing test is the oracle**. An agent can't know a bug
is fixed unless "fixed" is defined by a test flipping red → green. No repro test, no termination signal.

**All commands run from the workspace root** unless noted.

## Required Context
- Component name (kebab-case and PascalCase, e.g. `ds-card` / `DsCard`)
- Tag prefix (e.g. `ds`)
- A bug report — free text, a GitHub issue, or a failing-behavior description
- Build namespace (from `stencil.config.ts` → `namespace`, default `my-org`) — only if an e2e repro is needed

This skill runs under the shared **Loop Budget** — see [`../_shared/loop-budget.md`](../_shared/loop-budget.md).
All caps, the `same-error` key, and the escalation-on-breach procedure are defined there.

---

## PHASE 1: Reproduce — the oracle

Write a test that **fails because of the defect** before touching any source. This is the definition
of "done" for the whole skill: the fix is complete only when this test goes green.

### Step 1 — Decide spec vs e2e

Pick the cheapest layer that can express the bug. See
[`references/repro-test-patterns.md`](references/repro-test-patterns.md) for the full decision guide.

- **Spec (`newSpecPage`)** — the bug is in render output, prop→DOM mapping, event detail, or state
  logic. Fast, no browser.
- **E2E (Playwright)** — the bug only appears with real hydration, layout, focus/keyboard, pointer
  events, or cross-shadow interaction.

### Step 2 — Write the failing test

Add a **new, clearly-named** test capturing the exact reported behavior. Do NOT modify or weaken an
existing test to reproduce.

- Spec → append to `packages/core/src/components/[name]/[name].spec.tsx`
- E2E → append to `packages/core/e2e/[name].e2e.ts`

Name it after the defect, e.g. `it('reflects the elevated prop (repro: ISSUE-012)', …)`.

### Step 3 — Gate: it must fail for the expected reason

```bash
cd packages/core && pnpm exec stencil test --spec [name] 2>&1   # or: pnpm exec playwright test [name] 2>&1
```

- The new test **must fail**, and the failure message must match the reported defect (e.g. the assert
  on the ignored prop fails — not a typo, missing import, or unrelated error).
- If it **passes**, the bug is not reproduced: either the report is stale/misunderstood or the test
  doesn't exercise the defect. **Do not proceed to fix.** Refine the test once; if it still can't be
  made to fail for the expected reason → **escalate** (Phase 1 failure = "not reproducible"). No repro → stop.

Log the run: `node scripts/loop/log.mjs stencil-bugfix gate --result fail --note "repro red as expected"`

---

## PHASE 2: Localize

Form a precise hypothesis: **file + lines + why**.

### Step 1 — Pull source and existing tests via the component-library MCP

This is exactly what the MCP layer exists for:

- `get_component` → `.tsx` source, `.css` styles, and auto-generated `readme.md`
- `get_component_tests` → the existing spec + e2e files (understand current coverage before you touch it)
- `list_components` → confirm the exact kebab-case name if unsure

### Step 2 — Targeted grep to pinpoint

```bash
grep -n "propName\|render\|@Prop\|@Event\|:host" packages/core/src/components/[name]/[name].tsx
```

### Step 3 — Write the hypothesis

One or two lines, concrete:

```
Hypothesis: ds-card.tsx:34 — `elevated` @Prop is declared but never read in render(); the
class map omits `ds-card--elevated`, so the shadow shadow never gets applied. Fix: add it to
the Host class map.
```

---

## PHASE 3: Fix

Apply the **smallest** edit that makes the repro test pass. Fix the defect, not the symptom; do not
refactor unrelated code.

**Self-correction loop — under the Loop Budget:**
1. Apply a minimal edit to exactly one file (usually the `.tsx` or `.css`).
2. Re-run the repro test (Phase 1 command).
3. Green → go to Phase 4. Still red → read the **complete** output, revise the hypothesis, re-edit.
4. Count attempts by error key via `node scripts/loop/same-error.mjs`.
5. On any Loop Budget cap breach → run the **escalation-on-breach procedure** in
   [`../_shared/loop-budget.md`](../_shared/loop-budget.md): capture output → log to
   stencil-issue-tracker POST-ERROR → `bash scripts/loop/rollback.sh bugfix [name]` (reverts the fix,
   **keeps** the repro test) → write a `blocked` handoff → stop.

---

## PHASE 4: Verify — two gates, both required

A fix is complete only when **both** gates are green. One is not enough.

### Gate A — the repro test passes

```bash
cd packages/core && pnpm exec stencil test --spec [name] 2>&1     # or playwright test [name] for an e2e repro
```

### Gate B — the full existing suite still passes (no regressions)

Run the **entire** spec and e2e suites, not just this component's tests:

```bash
cd packages/core && pnpm exec stencil test --spec 2>&1
cd packages/core && pnpm exec stencil test --e2e 2>&1
```

- All pre-existing tests must still pass. A fix that breaks another test has **not** completed — treat
  the new failure as a fresh error under the Loop Budget and return to Phase 3.

### Gate C — design-lint still clean

The fix must not violate DESIGN.md (especially if the `.css` was touched):

```bash
node scripts/design-lint.mjs [name] 2>&1   # expect: { "pass": true }
```

Log each gate: `node scripts/loop/log.mjs stencil-bugfix gate --result pass`.

---

## PHASE 5: Guard

Lock in the fix so the bug can't silently return.

1. **Keep the repro test permanently** — it is the regression guard. Never delete or `xit` it.
2. **Log the root cause** via **stencil-issue-tracker** POST-ERROR: append/increment the entry in
   `references/known-issues.md` (symptom, root cause, fix, preventive check). This is mandatory, not
   optional — even a first occurrence gets logged so recurrence can be tracked.
3. **Note API impact:** if the fix changed the public API (a `@Prop`, `@Event`, `@Method`, or slot),
   flag that **framework-integration-testing** must be re-run for the Angular/React/Vue wrappers.
4. **Write a structured-handoff** (WRITE mode) — the five fields, status `complete`.

---

## Definition of Success

- [ ] A new, clearly-named repro test was added (spec or e2e) that **failed for the reported reason** before any fix
- [ ] Hypothesis recorded: file + lines + why (Phase 2)
- [ ] Minimal fix applied to the component source under the Loop Budget
- [ ] **Gate A:** the repro test now passes
- [ ] **Gate B:** the full `stencil test --spec` and `--e2e` suites pass — no regressions
- [ ] **Gate C:** `node scripts/design-lint.mjs [name]` reports `pass: true`
- [ ] The repro test is kept permanently as a regression guard (not skipped, not deleted)
- [ ] Root cause logged via stencil-issue-tracker POST-ERROR
- [ ] API-change flag raised if a `@Prop`/`@Event`/`@Method`/slot changed (→ framework-integration-testing)
- [ ] Report back: `✅ Bugfix: [name] — repro green + full suite green (N/N), root cause logged`

---

## Escalation

Stop and escalate — do not fix blindly or loop forever — when:

- **Phase 1 fails:** the bug cannot be reproduced (the test won't fail for the expected reason after one
  refinement). Write a `blocked` handoff explaining what was tried; the report is likely stale or the
  defect is misunderstood. A kept-but-failing repro test is still a useful artifact for the next run.
- **Loop Budget breach in Phase 3/4:** follow the escalation-on-breach procedure in
  [`../_shared/loop-budget.md`](../_shared/loop-budget.md) — capture, log, `rollback.sh bugfix [name]`
  (keeps the repro test), `blocked` handoff, stop with a clear message.

---

## Skill Completion Protocol

Every pipeline skill ends the same way:

1. **stencil-issue-tracker POST-ERROR** — log the root cause and any errors self-corrected during the loop
   (mandatory; increment recurrence if the issue already exists).
2. **structured-handoff WRITE mode** — persist the five-field handoff report (status `complete`,
   `partial`, or `blocked`).

See `references/repro-test-patterns.md` for spec-vs-e2e guidance, the Stencil failure taxonomy, and
example failing-test snippets.
