# StencilJS Unit Test Patterns

Advanced `newSpecPage` patterns for complex scenarios.

---

## Async State Changes

```typescript
it('updates after async operation', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name]></[prefix]-[name]>`,
  });

  page.root.loadData();
  await page.waitForChanges();

  expect(page.root.shadowRoot.querySelector('.loaded')).toBeDefined();
});
```

---

## Named Slots

```typescript
it('renders named slot content', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `
      <[prefix]-[name]>
        <span slot="header">Title</span>
        <p slot="body">Content</p>
      </[prefix]-[name]>
    `,
  });
  expect(page.root.querySelector('[slot="header"]').textContent).toBe('Title');
});
```

---

## @Watch Decorators

```typescript
it('reacts to prop changes via @Watch', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name] value="initial"></[prefix]-[name]>`,
  });

  page.root.value = 'changed';
  await page.waitForChanges();

  expect(page.root.shadowRoot.querySelector('.display').textContent).toBe('changed');
});
```

---

## @Method Decorators

```typescript
it('exposes public reset method', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name] value="filled"></[prefix]-[name]>`,
  });

  await page.root.reset();
  await page.waitForChanges();

  expect(page.root.value).toBe('');
});
```

---

## Multiple Components (Composition)

```typescript
it('renders child component correctly', async () => {
  const page = await newSpecPage({
    components: [ParentComponent, ChildComponent],
    html: `<[prefix]-parent></[prefix]-parent>`,
  });

  const child = page.root.shadowRoot.querySelector('[prefix]-child');
  expect(child).toBeDefined();
});
```

---

## Testing Host Element Classes

```typescript
it('adds is-active class when active prop is true', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name] active></[prefix]-[name]>`,
  });

  expect(page.root).toHaveClass('is-active');
});
```

---

## Mocking External Dependencies

```typescript
// Mock a global or service
jest.mock('../services/my-service', () => ({
  fetchData: jest.fn().mockResolvedValue({ result: 'mocked' }),
}));

it('renders data from service', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name]></[prefix]-[name]>`,
  });
  await page.waitForChanges();
  expect(page.root.shadowRoot.querySelector('.data').textContent).toBe('mocked');
});
```

---

## Asserting Shadow DOM Content

```typescript
it('renders inner button', async () => {
  const page = await newSpecPage({
    components: [ComponentName],
    html: `<[prefix]-[name] label="Submit"></[prefix]-[name]>`,
  });

  const btn = page.root.shadowRoot.querySelector('button');
  expect(btn).not.toBeNull();
  expect(btn.textContent).toBe('Submit');
  expect(btn.getAttribute('aria-label')).toBe('Submit');
});
```
