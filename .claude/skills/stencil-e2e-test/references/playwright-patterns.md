# Playwright Patterns for Web Components

Advanced Playwright patterns for testing StencilJS components.

---

## Shadow DOM Piercing

Use `>>` to cross the shadow boundary in Playwright locators:

```typescript
// Select an element inside the shadow root
const innerBtn = page.locator('ds-button >> button');
await expect(innerBtn).toBeVisible();
await expect(innerBtn).toHaveText('Submit');

// Nested shadow DOM (two levels)
const deepEl = page.locator('ds-card >> ds-button >> button');
```

---

## Waiting for Stencil Hydration

Always wait for the `.hydrated` class before interacting:

```typescript
await page.waitForSelector('ds-button.hydrated');
// or with a custom timeout:
await page.waitForSelector('ds-[name].hydrated', { timeout: 15_000 });
```

---

## Setting Properties (not Attributes)

For complex props (objects, arrays, booleans) that aren't reflected as attributes, use `page.evaluate`:

```typescript
await page.evaluate(() => {
  const el = document.querySelector('ds-[name]') as any;
  el.items = [{ id: 1, label: 'Option A' }, { id: 2, label: 'Option B' }];
  el.config = { multiSelect: true };
});
await page.waitForTimeout(50); // let Stencil re-render
```

---

## Capturing Custom Events

```typescript
const eventDetail = await page.evaluate(
  (tag) =>
    new Promise<unknown>((resolve) => {
      document.querySelector(tag)?.addEventListener(
        'dsChange',
        (e: Event) => resolve((e as CustomEvent).detail),
        { once: true },
      );
    }),
  'ds-[name]',
);
expect(eventDetail).toEqual({ value: 'expected' });
```

---

## Keyboard Interaction

```typescript
// Focus and press Enter
await page.locator('ds-[name]').focus();
await page.keyboard.press('Enter');

// Type into a shadow input
const input = page.locator('ds-input >> input');
await input.fill('hello world');
await input.press('Tab');

// Arrow key navigation
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Space');
```

---

## Form Integration

```typescript
test('submits value in native form', async ({ page }) => {
  await page.setContent(`
    <script type="module" src="/build/my-org.esm.js"></script>
    <form id="f" action="/submit" method="post">
      <ds-input name="username"></ds-input>
      <button type="submit">Go</button>
    </form>
  `);
  await page.waitForSelector('ds-input.hydrated');

  const input = page.locator('ds-input >> input');
  await input.fill('johndoe');

  // Intercept form submit
  const [request] = await Promise.all([
    page.waitForRequest('/submit'),
    page.locator('button[type="submit"]').click(),
  ]);
  expect(request.postData()).toContain('username=johndoe');
});
```

---

## Accessibility — axe-core Integration

```bash
pnpm add -D @axe-core/playwright
```

```typescript
import AxeBuilder from '@axe-core/playwright';

test('has no accessibility violations', async ({ page }) => {
  await page.setContent(`
    <script type="module" src="/build/my-org.esm.js"></script>
    <ds-[name] label="Submit"></ds-[name]>
  `);
  await page.waitForSelector('ds-[name].hydrated');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});
```

---

## Visual Regression (Screenshot)

```typescript
test('matches visual snapshot', async ({ page }) => {
  await mountComponent(page, `<ds-[name] label="Hello"></ds-[name]>`);
  const el = page.locator('ds-[name]');
  await expect(el).toHaveScreenshot('[name]-default.png');
});

// Update snapshots:
// npx playwright test --update-snapshots
```

---

## Network Mocking

```typescript
test('handles fetch failure gracefully', async ({ page }) => {
  await page.route('/api/data', (route) => route.abort('failed'));

  await mountComponent(page, `<ds-[name]></ds-[name]>`);
  const error = page.locator('ds-[name] >> .error-message');
  await expect(error).toBeVisible();
});
```

---

## Multiple Viewports / Responsive

```typescript
test('renders correctly on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mountComponent(page, `<ds-[name]></ds-[name]>`);
  const el = page.locator('ds-[name]');
  await expect(el).toBeVisible();
  // assert mobile-specific layout
});
```

---

## Page Object Model for Reuse

```typescript
// e2e/page-objects/ds-button.po.ts
import { Locator, Page } from '@playwright/test';

export class DsButtonPO {
  private readonly el: Locator;

  constructor(page: Page, testId?: string) {
    this.el = testId
      ? page.locator(`ds-button[data-testid="${testId}"]`)
      : page.locator('ds-button');
  }

  get innerButton() { return this.el.locator('>> button'); }
  async click() { await this.el.click(); }
  async isDisabled() { return this.el.evaluate((el: any) => el.disabled); }
}
```

```typescript
// e2e/ds-button.e2e.ts
import { DsButtonPO } from './page-objects/ds-button.po';

test('uses page object', async ({ page }) => {
  await mountComponent(page, `<ds-button label="Go"></ds-button>`);
  const btn = new DsButtonPO(page);
  await btn.click();
  expect(await btn.isDisabled()).toBe(false);
});
```

---

## Playwright Config Tips

```typescript
// playwright.config.ts — useful additions

// Run tests in all three major browsers
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
],

// Automatically attach screenshot on failure
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
},
```
