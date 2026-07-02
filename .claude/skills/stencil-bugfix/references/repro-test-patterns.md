# Reproduce-First Test Patterns

Reference for **stencil-bugfix** Phase 1. How to choose the right test layer for a repro, what the
common Stencil failures mean, and two example failing tests.

---

## Spec vs E2E — decision guide

The repro should live at the **cheapest layer that can still express the bug**. Spec tests
(`newSpecPage`) run in Node with no browser and are fast; e2e tests (Playwright) run in a real browser
with full hydration and are slower but strictly more capable.

| The bug is about… | Use | Why |
|-------------------|-----|-----|
| Render output for given props (wrong markup, missing class, wrong attribute) | **Spec** | `page.root.shadowRoot` exposes the rendered tree without a browser |
| Prop → DOM mapping / reflection (`@Prop({ reflect: true })`) | **Spec** | Assert `page.root` attributes after `waitForChanges()` |
| Event detail / payload of a `@Event` | **Spec** | Attach a listener, trigger, assert `detail` |
| `@Watch` / state transition logic | **Spec** | Mutate a prop, `await page.waitForChanges()`, assert |
| `@Method` behavior | **Spec** | Call the method on `page.root`, assert the result |
| Slotted content projection presence | **Spec** | `page.root.textContent` / query the slot |
| Real hydration (`.hydrated` class, lazy bundle) | **E2E** | `newSpecPage` doesn't exercise the runtime loader |
| Focus, `:focus-visible`, keyboard (Tab/Enter/Escape) | **E2E** | Focus & key events need a real browser |
| Pointer interaction, `click({ force })`, disabled-doesn't-fire | **E2E** | Real event dispatch and default-prevention |
| Computed layout / visual geometry / CSS that only resolves in-browser | **E2E** | Spec DOM has no layout engine |
| Cross-shadow-boundary interaction, multiple components together | **E2E** | Needs the full DOM + shadow piercing (`>>`) |

**Rule of thumb:** if you can express the defect with `newSpecPage` and an assertion on
`page.root`/`shadowRoot`, do that. Reach for Playwright only when the bug genuinely needs the browser.

---

## Stencil failure taxonomy

When a test (repro or an existing one) fails, classify before fixing. Adapted from the
`stencil-e2e-test` taxonomy and extended for spec failures.

| Class | Signature | Likely cause | First move |
|-------|-----------|--------------|-----------|
| **assertion** | `expect(received).toBe(expected)` mismatch | The component behavior is wrong (this is your repro succeeding) OR the test expectation is wrong | Decide: is the bug in the component or the test? For a repro, this is the expected red. |
| **selector** | Element/locator not found; `shadowRoot` query returns null | Wrong shadow-DOM structure assumption, or `>>` pierce syntax missing in e2e | Print `page.root.shadowRoot` (spec) or check the real markup; fix the selector |
| **timeout** | Playwright times out waiting for `.hydrated` or a locator | Component didn't register/hydrate; build output missing; wrong namespace | Confirm the dev build exists and `NAMESPACE` matches `stencil.config.ts` |
| **server** | Dev server didn't start on `:3333`; connection refused | `stencil build --dev --serve` failed or port busy | Verify the webServer config; free the port; check the build log |
| **wrapper** | Failure only in an Angular/React/Vue integration test | Public API changed; proxies stale | Re-run `nx build core` to regenerate wrappers, then framework-integration-testing |

For counting attempts, remember: "same error" is the normalized first stderr line via
`node scripts/loop/same-error.mjs` (see `../_shared/loop-budget.md`), not the human class above.

---

## Example failing-test snippets

### Spec repro — ignored prop (e.g. `ds-card` ignores `elevated`)

The reported bug: setting `elevated` has no effect. This test asserts the expected effect and will
**fail red** until the component honors the prop.

```tsx
// packages/core/src/components/ds-card/ds-card.spec.tsx  (append)
import { newSpecPage } from '@stencil/core/testing';
import { DsCard } from './ds-card';

it('applies the elevated modifier when elevated is set (repro: ISSUE-012)', async () => {
  const page = await newSpecPage({
    components: [DsCard],
    html: `<ds-card elevated>Body</ds-card>`,
  });
  await page.waitForChanges();
  // Expected behavior the bug violates: host carries the elevated modifier class.
  expect(page.root.classList.contains('ds-card--elevated')).toBe(true);
});
```

Gate check: run `cd packages/core && pnpm exec stencil test --spec ds-card` — the assertion on
`ds-card--elevated` must fail *for that reason* (class absent), confirming the repro.

### E2E repro — disabled control still emits (needs a real browser)

The reported bug: a disabled component still fires its event on click.

```ts
// packages/core/e2e/ds-button.e2e.ts  (append)
import { test, expect } from '@playwright/test';

const NAMESPACE = 'my-org';
const TAG = 'ds-button';

test('disabled button does not emit dsClick (repro: ISSUE-018)', async ({ page }) => {
  await page.setContent(`
    <script type="module" src="/build/${NAMESPACE}.esm.js"></script>
    <${TAG} disabled>Save</${TAG}>
  `);
  await page.waitForSelector(`${TAG}.hydrated`, { timeout: 10_000 });

  await page.evaluate((tag) => {
    document.querySelector(tag)
      ?.addEventListener('dsClick', () => { (window as any).__fired = true; });
  }, TAG);

  await page.locator(TAG).click({ force: true });
  const fired = await page.evaluate(() => !!(window as any).__fired);
  expect(fired).toBe(false); // fails red while the bug lets a disabled button emit
});
```

Keep whichever repro you write **permanently** after the fix — it is the regression guard (Phase 5).
