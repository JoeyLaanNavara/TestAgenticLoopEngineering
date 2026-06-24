# StencilJS Testing Patterns Reference

Advanced patterns for complex testing scenarios.

---

## Async State Changes

```typescript
it('updates after async operation', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name]></ [prefix]-[name]>`,
  });

  // Trigger async operation
  page.root.loadData();
  await page.waitForChanges();

  expect(page.root.shadowRoot.querySelector('.loaded')).toBeDefined();
});
```

---

## Testing Named Slots

```typescript
it('renders named slot content', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `
      <[prefix]-[name]>
        <span slot="header">Title</span>
        <p slot="body">Content</p>
      </ [prefix]-[name]>
    `,
  });
  expect(page.root.querySelector('[slot="header"]').textContent).toBe('Title');
});
```

---

## Testing @Watch Decorators

```typescript
it('reacts to prop changes via @Watch', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name] value="initial"></ [prefix]-[name]>`,
  });

  page.root.value = 'changed';
  await page.waitForChanges();

  // assert the watch handler ran
  expect(page.root.shadowRoot.querySelector('.display').textContent).toBe('changed');
});
```

---

## Testing @Method Decorators

```typescript
it('exposes public method', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name]></ [prefix]-[name]>`,
  });

  await page.root.reset();
  await page.waitForChanges();

  expect(page.root.value).toBe('');
});
```

---

## E2E: Shadow DOM Piercing

```typescript
// Use >>> to pierce Shadow DOM in e2e
const innerEl = await page.find('[prefix]-[name] >>> .inner-class');
expect(innerEl).not.toBeNull();
```

---

## E2E: Keyboard Interaction

```typescript
it('handles keyboard navigation', async () => {
  const page = await newE2EPage();
  await page.setContent(`<[prefix]-[name]></ [prefix]-[name]>`);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForChanges();

  const element = await page.find('[prefix]-[name]');
  expect(element).toHaveClass('is-active');
});
```

---

## E2E: Form Integration

```typescript
it('integrates with native forms', async () => {
  const page = await newE2EPage();
  await page.setContent(`
    <form id="test-form">
      <[prefix]-[name] name="field"></ [prefix]-[name]>
    </form>
  `);

  const value = await page.$eval('#test-form', (form: HTMLFormElement) => {
    const data = new FormData(form);
    return data.get('field');
  });

  expect(value).toBe('expected-value');
});
```

---

## E2E: Accessibility

```typescript
it('has correct ARIA attributes', async () => {
  const page = await newE2EPage();
  await page.setContent(`<[prefix]-[name] label="Submit"></ [prefix]-[name]>`);

  const element = await page.find('[prefix]-[name]');
  expect(await element.getAttribute('aria-label')).toBe('Submit');
  expect(await element.getAttribute('role')).toBe('button');
});
```
