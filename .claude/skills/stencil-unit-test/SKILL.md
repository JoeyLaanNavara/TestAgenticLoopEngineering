---
name: stencil-unit-test
description: Write and run unit (spec) tests for a StencilJS component using newSpecPage, self-correcting until all tests pass. Use this skill after stencil-component-build has created the component source. Requires the component name and its .tsx source as context. Do NOT proceed to e2e testing until unit tests are green.
---

# StencilJS Unit Tests

Write, run, and self-correct spec tests for a StencilJS component using `@stencil/core/testing`.

## Required Context
- Component name (kebab-case and PascalCase)
- Component `.tsx` source (to understand props, events, methods)
- Tag prefix (e.g. `ds`)

---

## PHASE 1: Write Spec File

### File: `packages/core/src/components/[name]/[name].spec.tsx`

```typescript
import { newSpecPage } from '@stencil/core/testing';
import { ComponentName } from './[name]';

describe('[prefix]-[name]', () => {

  // ── Rendering ──────────────────────────────────────────────────
  it('renders with default props', async () => {
    const page = await newSpecPage({
      components: [ComponentName],
      html: `<[prefix]-[name]></[prefix]-[name]>`,
    });
    expect(page.root).toBeDefined();
    expect(page.root.shadowRoot).toBeDefined();
  });

  it('renders slot content', async () => {
    const page = await newSpecPage({
      components: [ComponentName],
      html: `<[prefix]-[name]>Hello</[prefix]-[name]>`,
    });
    expect(page.root.textContent).toContain('Hello');
  });

  // ── Props ──────────────────────────────────────────────────────
  it('applies prop values correctly', async () => {
    const page = await newSpecPage({
      components: [ComponentName],
      html: `<[prefix]-[name] prop-name="custom"></[prefix]-[name]>`,
    });
    expect(page.root.propName).toBe('custom');
  });

  it('reflects disabled attribute to host', async () => {
    const page = await newSpecPage({
      components: [ComponentName],
      html: `<[prefix]-[name] disabled></[prefix]-[name]>`,
    });
    expect(page.root.disabled).toBe(true);
    expect(page.root).toHaveAttribute('disabled');
  });

  // ── Events ─────────────────────────────────────────────────────
  it('emits change event', async () => {
    const page = await newSpecPage({
      components: [ComponentName],
      html: `<[prefix]-[name]></[prefix]-[name]>`,
    });
    const spy = jest.fn();
    page.root.addEventListener('[prefix][ComponentName]Change', spy);
    // trigger the event (call a method or simulate):
    // page.root.someMethod('new-value');
    // await page.waitForChanges();
    // expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: 'new-value' }));
  });

  // ── Edge Cases ─────────────────────────────────────────────────
  it('handles empty prop gracefully', async () => {
    const page = await newSpecPage({
      components: [ComponentName],
      html: `<[prefix]-[name] prop-name=""></[prefix]-[name]>`,
    });
    expect(page.root).toBeDefined(); // should not throw
  });
});
```

**Coverage requirements — every spec file must have:**
- Default render test
- Slot content test (if the component has a `<slot>`)
- One test per `@Prop`
- One test per `@Event` (verify it fires with correct detail)
- At least one edge case (empty value, invalid input, boundary condition)

---

## PHASE 2: Run Unit Tests

```bash
cd packages/core && pnpm exec stencil test --spec [name] 2>&1
```

**Self-correction loop — run until exit 0 with 0 failures:**
1. Run the command and capture full stdout + stderr
2. Check exit code — if 0 **and** output shows `X passing (0 failing)` → break ✅
3. Read the **complete** error output (never guess from a truncated snippet)
4. Determine: is the bug in the **component** or the **test**?
   - Component bug → fix the `.tsx`, then re-run
   - Test bug → fix the `.spec.tsx`, then re-run
   - Missing `@stencil/core/testing` import → add it
   - Async issue → add `await page.waitForChanges()` after state mutation
   - Selector not found → verify the shadow DOM structure with `page.root.shadowRoot`
5. Apply the fix to exactly one file, then re-run from step 1
6. **Loop Budget** (see [`../_shared/loop-budget.md`](../_shared/loop-budget.md)): two failures are the *same error* only if `node scripts/loop/same-error.mjs` returns the same key. Retry a given error at most **3×**; stop after **10** total fix attempts in this skill. On every resolved error you **must** log it via `stencil-issue-tracker` POST-ERROR (append if new, increment recurrence if known) — not optional. If the budget is exceeded, escalate: log the blocker, run `bash scripts/loop/rollback.sh <mode> <tag>`, write a `blocked` structured-handoff, and stop.

Do NOT mark unit tests complete until the loop exits with 0 failures.

---

## Definition of Success

- [ ] `packages/core/src/components/[name]/[name].spec.tsx` exists
- [ ] Covers: default render, slot content, every `@Prop`, every `@Event`, at least one edge case
- [ ] `cd packages/core && pnpm exec stencil test --spec [name]` exits with zero failures
- [ ] No tests are skipped (`xit`, `xdescribe`) without a documented reason
- [ ] Report back: `✅ Unit tests: X/X passing ([name].spec.tsx)`

See `references/unit-test-patterns.md` for advanced patterns (async state, slots, `@Watch`, `@Method`).
