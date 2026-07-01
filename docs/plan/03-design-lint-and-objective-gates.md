# 03 — `design-lint` + Objective Create Gates

**Goal:** replace the subjective terminal gate in `stencil-component-build` (Phase 5: "background is
distinct", "text is readable") with a **machine-checkable** oracle, so autonomous *create* has a
deterministic "done".

## Problem today

An autonomous agent can't terminate on a qualitative checklist — it either loops forever chasing an
unmeasurable target or declares victory arbitrarily. Most of `DESIGN.md` is mechanical, though, and
can be checked by a script.

## Design

### A. `scripts/design-lint.mjs` — a component CSS linter

Input: a component name. Reads `packages/core/src/components/<tag>/<tag>.css` (and `global.css` for
the token catalog). Asserts the DESIGN.md rules that are mechanical:

| Rule | Check |
|------|-------|
| Tokens only | No raw `#hex`, `rgb(`, `hsl(` literals outside a `var(--…)` fallback chain |
| Known tokens | Every `--ds-*` referenced exists in `global.css` (catch typos) |
| Shadow DOM | `:host` selector present |
| Size variants | Selectors/logic for `sm\|md\|lg` present for interactive components |
| Six states | `:hover`, `:focus-visible`, `:active`, `[disabled]`/`:disabled`, and a loading hook all present |
| Reduced motion | Any `transition`/`animation` is wrapped by a `prefers-reduced-motion: reduce` block |
| Spacing scale | Uses numbered `--ds-space-N`; flags legacy `--ds-spacing-xs/sm/...` in new code |

Output: JSON `{ pass: bool, violations: [...] }` and non-zero exit on failure — greppable, so the
loop terminates on `pass: true`.

### B. Objective contrast check

WCAG AA is a formula, not a judgment. `scripts/design-lint.mjs` (or a sibling `contrast.mjs`)
resolves the component's foreground/background tokens to their `global.css` values and computes the
contrast ratio, failing < 4.5:1 (text) / 3:1 (large text & UI). Replaces "text is readable".

### C. Rewrite the create gate

`stencil-component-build` Phase 5 "done" becomes a stack of green signals (all autonomous-checkable):

```
nx build core            → exit 0, no error/ERR
stencil test --spec      → 0 failing
stencil test --e2e       → 0 failing
node scripts/design-lint.mjs <tag>  → pass: true
framework wrappers build → Angular/React/Vue proxies present
```

Any residual truly-visual judgment (rare) becomes an explicit, capped "manual review" note rather
than a blocking loop — bounded at ≤5 cycles per [01](01-git-isolation-and-termination.md).

## Files to add / change

- New: `scripts/design-lint.mjs` (+ optional `scripts/contrast.mjs`).
- New: `package.json` script `"design-lint": "node scripts/design-lint.mjs"`.
- Edit: `stencil-component-build/SKILL.md` Phase 5 — swap the qualitative checklist for the signal
  stack above; keep a capped manual-review escape hatch.
- Optionally add `design-lint` as a stage gate in the orchestrator ([05](05-orchestrator-driver.md)).

## Acceptance criteria

- A component with a hardcoded `#fff` fails `design-lint` with a precise violation.
- A component missing `:focus-visible` or the reduced-motion wrapper fails.
- A low-contrast token pair fails the contrast check with the computed ratio.
- A compliant component passes, and the create loop terminates on it without human input.

## Effort

~1 day. The linter is regex/AST over CSS + a small token resolver; contrast is a ~30-line formula.
