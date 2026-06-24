---
name: framework-integration-testing
description: Write and run unit tests for StencilJS framework wrapper packages (Angular, React, Vue). Tests verify that component proxies render the correct custom element, forward props as DOM element properties, and surface events correctly. Always run stencil-bootstrap and `nx build core` first. Use this skill when adding a new component or verifying that a component works correctly through each framework wrapper.
---

# Framework Integration Testing

Test StencilJS component wrappers across Angular, React, and Vue. These tests live in dedicated test apps (`apps/angular-test/`, `apps/react-test/`, `apps/vue-test/`) and verify the **binding layer** — prop forwarding, element rendering, and event surface — not the Stencil component's internal behaviour (which is covered by `stencil-testing`).

## What these tests do NOT do
- Test Stencil component rendering, lifecycle, or shadow DOM — use `stencil-testing` for that.
- Boot a real browser. Tests run in happy-dom / jsdom, so the web component's JavaScript never executes. The custom element tag is present but behaves as an unknown HTMLElement.

## Required Context
- Component name in kebab-case (e.g. `ds-button`) and PascalCase (`DsButton`)
- Component `@Prop` names and types (from `packages/core/src/components.d.ts`)
- Component `@Event` names (from the same file)

---

## PRE-FLIGHT

### 1. Confirm the generated wrapper proxies are up to date
```bash
ls packages/angular/src/directives/proxies.ts 2>/dev/null || echo "MISSING"
ls packages/react/src/components/stencil-generated/index.ts 2>/dev/null || echo "MISSING"
ls packages/vue/src/components/stencil-generated/index.ts 2>/dev/null || echo "MISSING"
```
If any are MISSING, the core has not been built or the output targets are not configured.
Run: `nx run core:build:dev`

### 2. Confirm the test apps exist
```bash
for dir in apps/angular-test apps/react-test apps/vue-test; do
  ls "$dir/package.json" 2>/dev/null && echo "$dir ✓" || echo "$dir MISSING — scaffold it"
done
```
The apps already exist in this repo. If they are missing, scaffold them using the templates in `references/test-patterns.md`.

### 3. Install dependencies
```bash
pnpm install
```

---

## PHASE 1: Locate the component in each wrapper

### Verify the component is exported
```bash
# Angular
grep -n "DsButton\|ds-button" packages/angular/src/directives/proxies.ts

# React
grep -n "DsButton\|ds-button" packages/react/src/components/stencil-generated/index.ts

# Vue
grep -n "DsButton\|ds-button" packages/vue/src/components/stencil-generated/index.ts
```

If the component is absent from any wrapper, rebuild:
```bash
nx run core:build:dev
```

---

## PHASE 2: Write tests

Create one test file per framework. Replace `ds-button` / `DsButton` with the actual component name.

### File locations
| Framework | Test file path |
|-----------|----------------|
| Angular   | `apps/angular-test/src/tests/[component-name].spec.ts`   |
| React     | `apps/react-test/src/tests/[component-name].spec.tsx`    |
| Vue       | `apps/vue-test/src/tests/[component-name].spec.ts`       |

---

### Angular test pattern

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DsButton } from '@my-org/angular';   // replace with actual component

@Component({
  template: `
    <ds-button
      [label]="label"
      [variant]="variant"
      [disabled]="disabled"
    ></ds-button>
  `,
})
class TestHostComponent {
  label = 'Test';
  variant: 'primary' | 'secondary' | 'danger' = 'primary';
  disabled = false;
}

describe('DsButton — Angular wrapper', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent, DsButton],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  // ── Rendering ──────────────────────────────────────────────
  it('renders the ds-button custom element', () => {
    expect(fixture.nativeElement.querySelector('ds-button')).toBeTruthy();
  });

  it('creates the Angular wrapper component instance', () => {
    const debugEl = fixture.debugElement.query(By.directive(DsButton));
    expect(debugEl.componentInstance).toBeInstanceOf(DsButton);
  });

  // ── Props (one test per @Prop) ──────────────────────────────
  it('forwards [label] to the element property', () => {
    fixture.componentInstance.label = 'Hello';
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('ds-button') as any).label).toBe('Hello');
  });

  it('forwards [variant]="secondary" to the element property', () => {
    fixture.componentInstance.variant = 'secondary';
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('ds-button') as any).variant).toBe('secondary');
  });

  it('forwards [disabled]=true to the element property', () => {
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('ds-button') as any).disabled).toBe(true);
  });

  // ── Events ─────────────────────────────────────────────────
  // The Angular proxy exposes events as RxJS Observables (proxyOutputs).
  // DOM events can also be listened to directly on the element.
  it('dsClick Observable emits when dsClick DOM event fires', (done) => {
    const debugEl = fixture.debugElement.query(By.directive(DsButton));
    const comp = debugEl.componentInstance as DsButton & { dsClick: any };
    const el = fixture.nativeElement.querySelector('ds-button') as HTMLElement;

    comp.dsClick.subscribe(() => done());
    el.dispatchEvent(new CustomEvent('dsClick', { bubbles: true }));
  });

  it('direct DOM listener receives dsClick events', () => {
    const handler = jest.fn();
    const el = fixture.nativeElement.querySelector('ds-button') as HTMLElement;
    el.addEventListener('dsClick', handler);
    el.dispatchEvent(new CustomEvent('dsClick'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

**Coverage requirements for each Angular test file:**
- [ ] Default render test
- [ ] Angular component instance creation test
- [ ] One `[propName]` test per `@Prop`
- [ ] One event Observable subscription test per `@Event`
- [ ] One direct DOM event listener test per `@Event`

---

### React test pattern

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { DsButton } from '@my-org/react';   // replace with actual component

describe('DsButton — React wrapper', () => {
  // ── Rendering ──────────────────────────────────────────────
  it('renders the ds-button custom element', () => {
    const { container } = render(<DsButton />);
    expect(container.querySelector('ds-button')).toBeTruthy();
  });

  // ── Props (one test per @Prop) ──────────────────────────────
  it('forwards label prop as element property', () => {
    const { container } = render(<DsButton label="Hello" />);
    expect((container.querySelector('ds-button') as any).label).toBe('Hello');
  });

  it('forwards variant="secondary" as element property', () => {
    const { container } = render(<DsButton variant="secondary" />);
    expect((container.querySelector('ds-button') as any).variant).toBe('secondary');
  });

  it('forwards disabled=true as element property', () => {
    const { container } = render(<DsButton disabled />);
    expect((container.querySelector('ds-button') as any).disabled).toBe(true);
  });

  // ── Events ─────────────────────────────────────────────────
  // createReactComponent uses attachProps() which maps onDsClick → addEventListener('dsClick').
  it('calls onDsClick handler when dsClick event fires', () => {
    const handler = vi.fn();
    const { container } = render(
      <DsButton onDsClick={handler as unknown as (e: CustomEvent<void>) => void} />
    );
    (container.querySelector('ds-button') as HTMLElement)
      .dispatchEvent(new CustomEvent('dsClick', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // ── Slot / children ────────────────────────────────────────
  it('renders children inside the custom element', () => {
    const { container } = render(<DsButton>Label text</DsButton>);
    expect((container.querySelector('ds-button') as HTMLElement).textContent).toBe('Label text');
  });

  // ── Prop updates ───────────────────────────────────────────
  it('updates element property when prop changes', () => {
    const { container, rerender } = render(<DsButton label="Before" />);
    rerender(<DsButton label="After" />);
    expect((container.querySelector('ds-button') as any).label).toBe('After');
  });
});
```

**Coverage requirements for each React test file:**
- [ ] Default render test
- [ ] One prop forwarding test per `@Prop`
- [ ] One `onDsXxx` handler test per `@Event` (dispatches via `dispatchEvent`)
- [ ] Children/slot test (if component accepts children)
- [ ] Prop update / re-render test

---

### Vue test pattern

```typescript
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { DsButton } from '@my-org/vue';   // replace with actual component

const globalConfig = {
  config: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('ds-'),
    },
  },
};

describe('DsButton — Vue wrapper', () => {
  // ── Rendering ──────────────────────────────────────────────
  it('renders the ds-button custom element', () => {
    const wrapper = mount(DsButton, { props: { label: 'Test' }, global: globalConfig });
    expect(wrapper.find('ds-button').exists()).toBe(true);
  });

  // ── Props (one test per @Prop) ──────────────────────────────
  it('forwards label prop to the element', async () => {
    const wrapper = mount(DsButton, { props: { label: 'Hello' }, global: globalConfig });
    await wrapper.vm.$nextTick();
    expect((wrapper.find('ds-button').element as any).label).toBe('Hello');
  });

  it('forwards variant="secondary" to the element', async () => {
    const wrapper = mount(DsButton, { props: { variant: 'secondary' }, global: globalConfig });
    await wrapper.vm.$nextTick();
    expect((wrapper.find('ds-button').element as any).variant).toBe('secondary');
  });

  it('forwards disabled=true to the element', async () => {
    const wrapper = mount(DsButton, { props: { disabled: true }, global: globalConfig });
    await wrapper.vm.$nextTick();
    expect((wrapper.find('ds-button').element as any).disabled).toBe(true);
  });

  // ── Prop updates ───────────────────────────────────────────
  it('updates the element property when a prop changes', async () => {
    const wrapper = mount(DsButton, { props: { label: 'Before' }, global: globalConfig });
    await wrapper.setProps({ label: 'After' });
    expect((wrapper.find('ds-button').element as any).label).toBe('After');
  });

  // ── Slot / children ────────────────────────────────────────
  it('renders default slot content', () => {
    const wrapper = mount(DsButton, { slots: { default: 'Button label' }, global: globalConfig });
    expect(wrapper.find('ds-button').text()).toBe('Button label');
  });

  // ── Events ─────────────────────────────────────────────────
  // Vue hyphenates onXxx → addEventListener('x-x') via its patchEvent path.
  // For camelCase Stencil events (dsClick), attach a DOM listener directly.
  it('allows a parent to listen to DOM dsClick events', async () => {
    const handler = vi.fn();
    const Host = defineComponent({
      components: { DsButton },
      template: `<DsButton ref="btn" />`,
      mounted() {
        (this.$refs.btn as any).$el.addEventListener('dsClick', handler);
      },
    });
    const wrapper = mount(Host, { global: globalConfig });
    await wrapper.vm.$nextTick();
    wrapper.find('ds-button').element.dispatchEvent(new CustomEvent('dsClick', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

**Coverage requirements for each Vue test file:**
- [ ] Default render test
- [ ] One prop forwarding test per `@Prop`
- [ ] Prop update test
- [ ] Children/slot test
- [ ] One DOM-level event listener test per `@Event`

---

## PHASE 3: Run the tests

### Run all framework tests
```bash
nx test angular-test
nx test react-test
nx test vue-test
```

### Run a single framework
```bash
# Angular (from workspace root)
cd apps/angular-test && pnpm exec jest --verbose 2>&1

# React
cd apps/react-test && pnpm exec vitest run --reporter=verbose 2>&1

# Vue
cd apps/vue-test && pnpm exec vitest run --reporter=verbose 2>&1
```

### Self-correction loop — run until exit 0 with 0 failures in all three frameworks

For each framework (Angular, React, Vue), independently loop:
1. Run the framework's test command and capture full stdout + stderr
2. Check exit code — if 0 **and** output shows all tests passing → break for that framework ✅
3. Read the **complete** error output (never guess from a truncated snippet)
4. Determine: is the failure in the **test code**, the **wrapper package**, or the **test app config**?
   Common causes and fixes:
   - `Cannot find module '@my-org/angular|react|vue'` → run `pnpm install --no-frozen-lockfile`
   - `Cannot find module 'jest-preset-angular'` → run `pnpm install` inside `apps/angular-test/`
   - `proxyInputs is not a function` → verify `packages/angular/src/directives/angular-component-lib/utils.ts` exists; run `nx run core:build`
   - `el.label is undefined` (Angular) → check that the component is in `declarations` and `proxyInputs` has run
   - `el.label is undefined` (Vue) → add `await wrapper.vm.$nextTick()` before accessing element properties
   - Wrapper missing the new component → run `nx run core:build:dev` to regenerate proxies
5. Apply the fix, then re-run the **same framework's** test command from step 1
6. After 3 failed attempts on the **same** error: search `stencil-issue-tracker/references/known-issues.md`; document if new

Do NOT mark framework integration tests complete until all three framework test commands exit 0 with 0 failures.

---

## PHASE 4: Wire into the NX task graph

Add framework tests as dependents of the core `build` in `nx.json` to ensure proxies are regenerated before tests run:

```json
{
  "targetDefaults": {
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

Then `nx run-many --target=test --all` builds core first, regenerates wrappers, then runs all tests.

---

## Definition of Success

- [ ] All three test apps (`apps/angular-test/`, `apps/react-test/`, `apps/vue-test/`) exist with correct configs
- [ ] For every component tested: one spec file exists per framework covering render, all props, all events, and slot content
- [ ] `nx test angular-test` exits with zero failures
- [ ] `nx test react-test` exits with zero failures
- [ ] `nx test vue-test` exits with zero failures
- [ ] No tests are skipped (`xit`, `xdescribe`, `.skip`) without a documented reason
- [ ] The self-correction loop ran to completion — no test failures remain unresolved

See `references/test-patterns.md` for advanced patterns, app scaffolding templates, and known edge cases.
