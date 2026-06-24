---
name: stencil-component-build
description: Build a StencilJS web component — the .tsx source, .css styles, and barrel index.ts — following project conventions. Use this skill whenever an agent needs to create or scaffold a new StencilJS component, write a component's TypeScript and CSS, or add a component to an existing library. Always trigger after stencil-bootstrap has confirmed the project is correctly set up. Requires component name and project conventions (tag prefix, CSS var pattern) as input context.
---

# StencilJS Component Build

Create a production-ready StencilJS component following the project's established conventions.

**All commands run from the workspace root** (`/path/to/TestAgenticLoopEngineering`) unless noted.

## Required Context (from stencil-bootstrap or prior analysis)
- Component name (PascalCase, e.g. `DatePicker`)
- Tag prefix (e.g. `ds`)
- CSS variable naming pattern
- Any existing prop/event patterns from the library

---

## PHASE 1: Derive Names

From the component name, establish:
- **kebab-case name**: `date-picker`
- **PascalCase class**: `DsDatePicker`
- **Full tag**: `ds-date-picker`
- **Directory**: `packages/core/src/components/ds-date-picker/`

---

## PHASE 2: Create Component Files

### `packages/core/src/components/[tag]/[tag].tsx`

```tsx
import { Component, Prop, Event, EventEmitter, Host, h } from '@stencil/core';

@Component({
  tag: 'ds-[name]',
  styleUrl: 'ds-[name].css',
  shadow: true,
})
export class Ds[ComponentName] {
  // ─── Props ────────────────────────────────────────────────────
  /** Short description of this prop — appears in auto-generated docs */
  @Prop() propName: string = 'default';

  /** Whether the component is disabled */
  @Prop({ reflect: true }) disabled: boolean = false;

  // ─── Events ───────────────────────────────────────────────────
  /** Emitted when the value changes */
  @Event() ds[ComponentName]Change: EventEmitter<string>;

  // ─── Lifecycle ────────────────────────────────────────────────
  componentWillLoad() {
    // setup before first render
  }

  // ─── Render ───────────────────────────────────────────────────
  render() {
    return (
      <Host
        class={{
          'ds-[name]': true,
          'is-disabled': this.disabled,
        }}
      >
        <slot />
      </Host>
    );
  }
}
```

**Rules:**
- Always use `<Host>` as the root element
- Use `shadow: true` always
- Add JSDoc comments on every `@Prop` and `@Event` — they become auto-generated docs
- Use `{ reflect: true }` on props that should mirror as HTML attributes (booleans, ARIA states)
- Name events with the `ds` prefix to avoid collisions: `dsButtonClick` not `click`
- Class name is `Ds[ComponentName]` (PascalCase with `Ds` prefix)

### `packages/core/src/components/[tag]/[tag].css`

```css
/**
 * @prop --ds-[name]-color: Primary foreground color
 * @prop --ds-[name]-bg: Background color
 * @prop --ds-[name]-padding: Internal padding
 * @prop --ds-[name]-border-radius: Corner radius
 */

:host {
  --ds-[name]-color: var(--ds-color-primary, #007bff);
  --ds-[name]-bg: var(--ds-color-surface, #ffffff);
  --ds-[name]-padding: var(--ds-spacing-md, 12px);
  --ds-[name]-border-radius: var(--ds-border-radius-md, 4px);

  display: inline-block;
  box-sizing: border-box;
}

:host([disabled]) {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
```

**Rules:**
- ALL themeable values must use CSS custom properties
- CSS vars fall back to global design tokens (`--ds-*`), then hardcoded defaults
- Document every exposed CSS var with a `@prop` JSDoc comment
- Use `:host([attr])` for reflected attribute styles, not class selectors

### `packages/core/src/components/[tag]/index.ts`

```typescript
export { Ds[ComponentName] } from './[tag]';
```

---

## PHASE 3: Verify Build

```bash
nx run core:build:dev 2>&1
```

**Self-correction loop — run until exit 0:**
1. Run the command and capture full stdout + stderr
2. Check exit code — if 0 **and** no `error` / `ERR` lines → break ✅
3. Read the **complete** error output (never guess from a truncated snippet)
4. Identify root cause and apply the fix:
   - Type mismatch on `@Prop` / `@Event` → fix the TypeScript type in the `.tsx`
   - Missing import (`h`, `Host`, `EventEmitter`, etc.) → add the import
   - Stencil decorator rule violation → consult CLAUDE.md component authoring guide
   - CSS file not found → verify `styleUrl` path matches actual file name
   - Barrel export conflict → check `src/index.ts` for duplicate exports
5. Re-run `nx run core:build:dev 2>&1` from step 1
6. After 3 failed attempts on the **same** error: search `stencil-issue-tracker/references/known-issues.md`; document if new

Do NOT proceed to Phase 4 or testing until this loop exits successfully.

---

## PHASE 4: Update Barrel Export

Add the new component to the library's root barrel if one exists:

```bash
ls packages/core/src/index.ts 2>/dev/null
```

If found, add:
```typescript
export * from './components/[tag]';
```

---

## Complete

Report back:
```
✅ ds-[name] component created
   packages/core/src/components/ds-[name]/ds-[name].tsx
   packages/core/src/components/ds-[name]/ds-[name].css
   packages/core/src/components/ds-[name]/index.ts
✅ Dev build passing  (nx run core:build:dev)
```

---

## Definition of Success

- [ ] All three component files are created: `.tsx` source, `.css` styles, `index.ts` barrel
- [ ] The component uses `<Host>` as the root element and `shadow: true`
- [ ] Every `@Prop` and `@Event` has a JSDoc comment
- [ ] All themeable values use CSS custom properties with global token fallbacks
- [ ] `nx run core:build:dev` exits with no errors after the component is added
- [ ] If `packages/core/src/index.ts` exists, the new component is exported from it
- [ ] The success report with all three file paths is returned to the calling agent
