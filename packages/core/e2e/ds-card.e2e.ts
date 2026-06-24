import { test, expect, Page } from '@playwright/test';

const NAMESPACE = 'my-org';
const TAG = 'ds-card';

const BASE_URL = 'http://localhost:3333';

async function mountComponent(page: Page, innerHTML: string): Promise<void> {
  await page.goto(`${BASE_URL}/`);
  await page.addScriptTag({ type: 'module', url: `${BASE_URL}/build/${NAMESPACE}.esm.js` });
  await page.evaluate((html) => {
    document.body.innerHTML = html;
  }, innerHTML);
  await page.waitForSelector(`${TAG}.hydrated`, { state: 'attached', timeout: 10_000 });
}

test.describe('ds-card', () => {

  // ── Hydration ────────────────────────────────────────────────
  test('renders and hydrates', async ({ page }) => {
    await mountComponent(page, `<${TAG}>Content</${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toBeVisible();
    await expect(el).toHaveClass(/hydrated/);
  });

  // ── Heading & subheading ─────────────────────────────────────
  test('renders heading text in shadow DOM', async ({ page }) => {
    await mountComponent(page, `<${TAG} heading="Card Title"></${TAG}>`);
    const heading = page.locator(`${TAG} >> .card__heading`);
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Card Title');
  });

  test('renders subheading text in shadow DOM', async ({ page }) => {
    await mountComponent(page, `<${TAG} heading="Title" subheading="Subtitle"></${TAG}>`);
    const sub = page.locator(`${TAG} >> .card__subheading`);
    await expect(sub).toBeVisible();
    await expect(sub).toHaveText('Subtitle');
  });

  test('does not render header when heading and subheading are absent', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);
    const header = page.locator(`${TAG} >> .card__header`);
    await expect(header).toHaveCount(0);
  });

  // ── Slot content ─────────────────────────────────────────────
  test('renders slotted body content', async ({ page }) => {
    await mountComponent(page, `<${TAG}><p id="body">Body text</p></${TAG}>`);
    const body = page.locator('#body');
    await expect(body).toBeVisible();
    await expect(body).toHaveText('Body text');
  });

  // ── Variant classes ──────────────────────────────────────────
  test('applies default variant class to host', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toHaveClass(/ds-card--default/);
  });

  test('applies outlined variant class to host', async ({ page }) => {
    await mountComponent(page, `<${TAG} variant="outlined"></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toHaveClass(/ds-card--outlined/);
  });

  test('applies elevated variant class to host', async ({ page }) => {
    await mountComponent(page, `<${TAG} variant="elevated"></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toHaveClass(/ds-card--elevated/);
  });

  // ── Clickable behavior ───────────────────────────────────────
  test('emits dsCardClick when clickable card is clicked', async ({ page }) => {
    await mountComponent(page, `<${TAG} clickable heading="Click me"></${TAG}>`);

    const eventPromise = page.evaluate((tag) =>
      new Promise<boolean>((resolve) => {
        document.querySelector(tag)?.addEventListener(
          'dsCardClick',
          () => resolve(true),
          { once: true },
        );
      }),
      TAG,
    );

    await page.locator(TAG).click();
    const fired = await eventPromise;
    expect(fired).toBe(true);
  });

  test('has role="button" when clickable', async ({ page }) => {
    await mountComponent(page, `<${TAG} clickable></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toHaveAttribute('role', 'button');
  });

  test('has tabindex="0" when clickable', async ({ page }) => {
    await mountComponent(page, `<${TAG} clickable></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toHaveAttribute('tabindex', '0');
  });

  test('is keyboard accessible — Enter activates clickable card', async ({ page }) => {
    await mountComponent(page, `<${TAG} clickable></${TAG}>`);

    const eventPromise = page.evaluate((tag) =>
      new Promise<boolean>((resolve) => {
        document.querySelector(tag)?.addEventListener(
          'dsCardClick',
          () => resolve(true),
          { once: true },
        );
      }),
      TAG,
    );

    await page.locator(TAG).focus();
    await page.keyboard.press('Enter');
    const fired = await eventPromise;
    expect(fired).toBe(true);
  });

  test('is keyboard accessible — Space activates clickable card', async ({ page }) => {
    await mountComponent(page, `<${TAG} clickable></${TAG}>`);

    const eventPromise = page.evaluate((tag) =>
      new Promise<boolean>((resolve) => {
        document.querySelector(tag)?.addEventListener(
          'dsCardClick',
          () => resolve(true),
          { once: true },
        );
      }),
      TAG,
    );

    await page.locator(TAG).focus();
    await page.keyboard.press('Space');
    const fired = await eventPromise;
    expect(fired).toBe(true);
  });

  // ── Disabled state ───────────────────────────────────────────
  test('has aria-disabled="true" when disabled', async ({ page }) => {
    await mountComponent(page, `<${TAG} disabled></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).toHaveAttribute('aria-disabled', 'true');
  });

  test('does not emit dsCardClick when clickable and disabled', async ({ page }) => {
    await mountComponent(page, `<${TAG} clickable disabled heading="Disabled card"></${TAG}>`);

    let eventFired = false;
    await page.evaluate((tag) => {
      document.querySelector(tag)?.addEventListener('dsCardClick', () => {
        (window as any).__cardClicked = true;
      });
    }, TAG);

    await page.locator(TAG).click({ force: true });
    await page.waitForTimeout(100);
    eventFired = await page.evaluate(() => !!(window as any).__cardClicked);
    expect(eventFired).toBe(false);
  });

  // ── Non-clickable card ───────────────────────────────────────
  test('non-clickable card has no role or tabindex', async ({ page }) => {
    await mountComponent(page, `<${TAG}></${TAG}>`);
    const el = page.locator(TAG);
    await expect(el).not.toHaveAttribute('role');
    await expect(el).not.toHaveAttribute('tabindex');
  });
});
