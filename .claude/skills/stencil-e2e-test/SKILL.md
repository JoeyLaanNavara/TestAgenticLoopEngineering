---
name: stencil-e2e-test
description: Write and run Playwright end-to-end tests for a StencilJS web component, self-correcting until all tests pass. Use this skill after stencil-unit-test has passed. Tests run in a real browser against the Stencil dev server. Requires the component name, its .tsx source, and the build namespace (default my-org). Do NOT mark e2e complete until all Playwright tests are green.
---

# StencilJS E2E Tests — Playwright

Write, run, and self-correct Playwright end-to-end tests for a StencilJS web component.

## Required Context
- Component name (kebab-case and PascalCase)
- Component `.tsx` source (to understand props, events, shadow DOM structure)
- Build namespace (from `stencil.config.ts` → `namespace`, default `my-org`)
- Tag prefix (e.g. `ds`)

---

## PHASE 1: Check & Install Playwright

### Check for existing Playwright config

```bash
ls packages/core/playwright.config.ts 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

### If missing — install Playwright

```bash
cd packages/core && pnpm add -D @playwright/test 2>&1
pnpm exec playwright install chromium 2>&1
```

### Playwright CLI reference (run from `packages/core/`)

| Command | Purpose |
|---------|---------|
| `pnpm exec playwright test` | Run all e2e tests |
| `pnpm exec playwright test [name]` | Run tests matching a file/title pattern |
| `pnpm exec playwright test --headed` | Show the browser window |
| `pnpm exec playwright test --debug` | Step-through debugger (Playwright Inspector) |
| `pnpm exec playwright test --ui` | Interactive Playwright UI mode |
| `pnpm exec playwright test --reporter=list` | Verbose per-test output |
| `pnpm exec playwright show-report` | Open the last HTML report |
| `pnpm exec playwright install` | Install all browsers |
| `pnpm exec playwright install chromium` | Install Chromium only |
| `pnpm exec playwright codegen http://localhost:3333` | Record interactions to generate test code |

---

## PHASE 2: Create Playwright Config (first time only)

### File: `packages/core/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3333',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm exec stencil build --dev --serve',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

---

## PHASE 3: Write E2E Test File

### File: `packages/core/e2e/[name].e2e.ts`

Create the `packages/core/e2e/` directory if it doesn't exist.

```typescript
import { test, expect, Page } from '@playwright/test';

// Replace NAMESPACE with the value from stencil.config.ts (default: my-org)
const NAMESPACE = 'my-org';
const TAG = '[prefix]-[name]';

async function mountComponent(page: Page, innerHTML: string): Promise<void> {
  await page.setContent(`
    <script type="module" src="/build/${NAMESPACE}.esm.js"></script>
    <script nomodule src="/build/${NAMESPACE}.js"></script>
    ${innerHTML}
  `);
  // Wait for Stencil hydration
  await page.waitForSelector(`${TAG}.hydrated`, { timeout: 10_000 });
}

test.describe(TAG, () => {

  // ── Hydration ──────────────────────────────────────────────────
  test('renders and hydrates', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toBeVisible();
    await expect(el).toHaveClass(/hydrated/);
  });

  // ── Prop Reflection ────────────────────────────────────────────
  test('reflects prop changes to the DOM', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);
    const el = page.locator(TAG);

    // Set a property via page.evaluate
    await page.evaluate(
      ([tag, value]) => {
        const el = document.querySelector(tag) as any;
        el.propName = value;
      },
      [TAG, 'updated-value'] as [string, string],
    );
    await page.waitForTimeout(50); // allow re-render

    // Assert the shadow DOM reflects the change
    const shadowEl = page.locator(`${TAG} >> .target-class`);
    await expect(shadowEl).toBeVisible();
  });

  // ── User Interaction ───────────────────────────────────────────
  test('responds to click', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);
    const el = page.locator(TAG);
    await el.click();
    // Assert visible DOM change or event side-effect
  });

  // ── Event Emission ─────────────────────────────────────────────
  test('emits event on interaction', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);

    // Capture the custom event
    const eventPromise = page.evaluate(
      (tag) =>
        new Promise<unknown>((resolve) => {
          document.querySelector(tag)?.addEventListener(
            '[prefix][ComponentName]Change',
            (e: Event) => resolve((e as CustomEvent).detail),
            { once: true },
          );
        }),
      TAG,
    );

    await page.locator(TAG).click();
    const detail = await eventPromise;
    expect(detail).toBeDefined();
  });

  // ── Disabled State ─────────────────────────────────────────────
  test('does not emit events when disabled', async ({ page }) => {
    await mountComponent(page, `<${TAG} disabled></${TAG}>`);

    let eventFired = false;
    await page.evaluate((tag) => {
      document
        .querySelector(tag)
        ?.addEventListener('[prefix][ComponentName]Change', () => {
          (window as any).__eventFired = true;
        });
    }, TAG);

    await page.locator(TAG).click({ force: true });
    eventFired = await page.evaluate(() => !!(window as any).__eventFired);
    expect(eventFired).toBe(false);
  });

  // ── Accessibility ──────────────────────────────────────────────
  test('has correct ARIA attributes', async ({ page }) => {
    await mountComponent(page, `<${TAG} label="Submit"></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toHaveAttribute('aria-label', 'Submit');
  });

  // ── Keyboard Navigation ────────────────────────────────────────
  test('is keyboard accessible', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);
    await page.keyboard.press('Tab');
    const el = page.locator(TAG);
    await expect(el).toBeFocused();
    await page.keyboard.press('Enter');
    // assert expected interaction result
  });
});
```

---

## PHASE 4: Run E2E Tests

```bash
cd packages/core && pnpm exec playwright test [name] 2>&1
```

**Self-correction loop — run until exit 0 with 0 failures:**
1. Run the command and capture full stdout + stderr
2. Check exit code — if 0 **and** output shows `X passed` with no `failed` lines → break ✅
3. Read the **complete** error output including the full stack trace (never guess)
4. Classify the failure:
   - Timeout waiting for `.hydrated` → component didn't register; verify `defineCustomElements()` is called, check build output exists
   - Selector not found → check shadow DOM pierce syntax (`>>`) and actual rendered markup
   - Assertion failure → check whether the component or the test expectation is wrong
   - Dev server not starting → confirm `pnpm exec stencil build --dev --serve` starts on port 3333
   - Playwright browser missing → run `pnpm exec playwright install chromium`
5. Apply the fix, then re-run from step 1
6. **Loop Budget** (see [`../_shared/loop-budget.md`](../_shared/loop-budget.md)): two failures are the *same error* only if `node scripts/loop/same-error.mjs` returns the same key. Retry a given error at most **3×**; stop after **10** total fix attempts in this skill. On every resolved error you **must** log it via `stencil-issue-tracker` POST-ERROR (append if new, increment recurrence if known) — not optional. If the budget is exceeded, escalate: log the blocker, run `bash scripts/loop/rollback.sh <mode> <tag>`, write a `blocked` structured-handoff, and stop.

Do NOT mark e2e complete until the loop exits with 0 failures.

**Debugging commands:**
```bash
# See what's in the page at failure point
cd packages/core && pnpm exec playwright test [name] --debug 2>&1

# Headed mode to watch the browser
cd packages/core && pnpm exec playwright test [name] --headed 2>&1

# Generate selectors interactively
cd packages/core && pnpm exec playwright codegen http://localhost:3333 2>&1
```

---

## Definition of Success

- [ ] `packages/core/playwright.config.ts` exists with correct `webServer` config
- [ ] `packages/core/e2e/[name].e2e.ts` exists
- [ ] Covers: hydration, prop reflection, user interaction, event emission, disabled state, ARIA
- [ ] `cd packages/core && pnpm exec playwright test [name]` exits with zero failures
- [ ] No tests use `.only()` or `.skip()` without a documented reason
- [ ] Report back: `✅ E2E tests: X/X passing ([name].e2e.ts)`

See `references/playwright-patterns.md` for advanced patterns (shadow DOM, forms, visual regression, accessibility).
