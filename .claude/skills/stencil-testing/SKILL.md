---
name: stencil-testing
description: DEPRECATED — use stencil-unit-test for spec tests and stencil-e2e-test for Playwright end-to-end tests. This skill is kept only as a redirect.
---

# StencilJS Testing — DEPRECATED

This skill has been split into two focused skills:

| Skill | Purpose |
|-------|---------|
| `stencil-unit-test` | Spec tests using `newSpecPage` from `@stencil/core/testing` |
| `stencil-e2e-test` | End-to-end tests using Playwright against the Stencil dev server |

**Always use the two new skills instead of this one.**

## Migration

Before | After
-------|------
`stencil-testing` (unit phase) | `stencil-unit-test`
`stencil-testing` (e2e phase) | `stencil-e2e-test`

The `references/testing-patterns.md` in this directory is now split between:
- `stencil-unit-test/references/unit-test-patterns.md`
- `stencil-e2e-test/references/playwright-patterns.md`
