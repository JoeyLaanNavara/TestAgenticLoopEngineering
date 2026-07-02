---
name: storybook-component
description: Write Storybook stories for a StencilJS web component and verify the Storybook build succeeds. Use this skill whenever an agent needs to create .stories.ts files for a component, document component variants and states visually, or verify Storybook builds correctly. Always trigger after stencil-unit-test has confirmed all tests pass. Requires the component name, tag prefix, and list of props/events as context.
---

# Storybook Component Stories

Write comprehensive Storybook stories for a StencilJS component and verify the build.

**All commands run from the workspace root** (`/path/to/TestAgenticLoopEngineering`) unless noted.

## Required Context
- Component full tag (e.g. `ds-button`)
- All `@Prop` names, types, and defaults
- All `@Event` names
- Any variants or significant states the component supports

## Project Storybook Setup

Stories live in **`apps/storybook/stories/`** — NOT inside `packages/core/`.
Components are loaded globally via `apps/storybook/.storybook/preview.ts` which calls `defineCustomElements()` from `@my-org/core/loader`. Individual story files do **not** import component classes.

---

## PHASE 1: Ensure Storybook is Configured

```bash
ls apps/storybook/.storybook/main.ts 2>/dev/null || ls apps/storybook/.storybook/main.js 2>/dev/null
```

**If missing** — Storybook is not yet set up. Initialize in `apps/storybook/`:
```bash
cd apps/storybook && pnpm exec storybook@latest init --type html
pnpm --filter @my-org/storybook add -D @storybook/web-components-vite lit
```

Verify `apps/storybook/.storybook/main.ts` contains:
```typescript
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

Verify `apps/storybook/.storybook/preview.ts` registers components:
```typescript
import '@my-org/core/loader';
import { defineCustomElements } from '@my-org/core/loader';
defineCustomElements();
```

---

## PHASE 2: Write Stories

### File: `apps/storybook/stories/[full-tag].stories.ts`

Example for `ds-button` → file is `apps/storybook/stories/ds-button.stories.ts`.

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

// Declare the args shape for this component
interface [ComponentName]Args {
  // One entry per @Prop
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  disabled: boolean;
}

// ── Meta ───────────────────────────────────────────────────────────────────

const meta: Meta<[ComponentName]Args> = {
  title: 'Design System/[ComponentName]',
  tags: ['autodocs'],

  // The render function is defined at Meta level so all stories share it
  render: (args) => html`
    <[full-tag]
      .label=${args.label}
      .variant=${args.variant}
      ?disabled=${args.disabled}
    ></ [full-tag]>
  `,

  argTypes: {
    // String props → text control
    label: {
      control: 'text',
      description: 'Description matching the @Prop JSDoc',
      table: { defaultValue: { summary: 'default' }, type: { summary: 'string' } },
    },

    // Enum props → select control
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual variant of the component',
    },

    // Boolean props → boolean control
    disabled: {
      control: 'boolean',
      description: 'Disables the component',
      table: { defaultValue: { summary: 'false' } },
    },
  },

  // Default args match @Prop defaults in the component
  args: {
    label: 'Label',
    variant: 'primary',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<[ComponentName]Args>;

// ── Stories ────────────────────────────────────────────────────────────────

/** Default state — all props at their default values */
export const Default: Story = {};

/** All visual variants side by side */
export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <[full-tag] variant="primary" label="Primary"></ [full-tag]>
      <[full-tag] variant="secondary" label="Secondary"></ [full-tag]>
      <[full-tag] variant="danger" label="Danger"></ [full-tag]>
    </div>
  `,
};

/** Disabled state — no interactions should fire */
export const Disabled: Story = {
  args: { disabled: true, label: 'Disabled' },
};

/** Stress test with long/unusual content */
export const EdgeCases: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <[full-tag] label="Very long label that might overflow the component bounds if not handled"></ [full-tag]>
      <[full-tag] label=""></ [full-tag]>
      <[full-tag] label="🎉 Emoji 🎉"></ [full-tag]>
    </div>
  `,
};
```

**Story requirements — must cover:**
- `Default` — all props at default values, controls enabled, autodocs visible
- `Variants` — every visual variant/size/color option
- `Disabled` — the disabled state
- `EdgeCases` — overflow, empty, special characters

**Prop binding rules:**
- Use `.propName=${args.propName}` (dot-binding) for object/array props and Stencil-specific props
- Use `?booleanProp=${args.booleanProp}` for boolean props (Lit's boolean attribute syntax)
- Use `propName=${args.propName}` for simple string/number attributes

---

## PHASE 3: Verify Storybook Build

```bash
nx run storybook:build-storybook 2>&1
```

**Self-correction loop — run until `NX Successfully ran` with no errors:**
1. Run `nx run storybook:build-storybook 2>&1` and capture full output
2. Check exit code — if 0 **and** output ends with `NX   Successfully ran target build-storybook` → break ✅
3. Read the **complete** error output (never guess from a truncated snippet)
4. Identify root cause and fix:
   - `Cannot find module 'lit'` → `pnpm --filter @my-org/storybook add lit`, then `pnpm install --no-frozen-lockfile`
   - `Cannot find module '@my-org/core/loader'` → add `"@my-org/core": "workspace:^"` to `apps/storybook/package.json` devDeps, run `pnpm install --no-frozen-lockfile`
   - `Cannot find module '@my-org/core'` loader export → run `nx run core:build` to regenerate `packages/core/loader/`
   - Story syntax / TypeScript error → fix the `.stories.ts` file
   - Vite resolve error → check import paths and installed packages
   - Node version → verify `node --version` ≥ 18; use `nvm use` if needed
   - Corepack `URL.canParse` error → Node < 19.9 in use; switch to Node ≥ 18 via `nvm use 20`
5. Re-run `nx run storybook:build-storybook 2>&1` from step 1
6. **Loop Budget** (see [`../_shared/loop-budget.md`](../_shared/loop-budget.md)): two failures are the *same error* only if `node scripts/loop/same-error.mjs` returns the same key. Retry a given error at most **3×**; stop after **10** total fix attempts in this skill. On every resolved error you **must** log it via `stencil-issue-tracker` POST-ERROR (append if new, increment recurrence if known) — not optional. If the budget is exceeded, escalate: log the blocker, run `bash scripts/loop/rollback.sh <mode> <tag>`, write a `blocked` structured-handoff, and stop.

Do NOT mark Storybook complete until this loop exits successfully.

---

## PHASE 4: Verify Story Count

After a successful build, confirm the stories file exports the expected named exports:

```bash
grep "^export const" apps/storybook/stories/[full-tag].stories.ts | wc -l
```

Minimum: **4 stories** (`Default`, `Variants`, `Disabled`, `EdgeCases`).

---

## Complete

```
✅ Storybook stories created: apps/storybook/stories/[full-tag].stories.ts
✅ Stories: Default | Variants | Disabled | EdgeCases
✅ Storybook build: passing  (nx run storybook:build-storybook)
```

---

## Definition of Success

- [ ] `apps/storybook/.storybook/main.ts` exists with stories glob pointing to `../stories/**`
- [ ] `apps/storybook/stories/[full-tag].stories.ts` is created with at least 4 named exports
- [ ] Every `@Prop` is mapped to an `argTypes` entry with the correct control type
- [ ] No component imports in the story file (components load from `preview.ts`)
- [ ] `nx run storybook:build-storybook` exits with no errors
- [ ] The self-correction loop ran to completion — no Storybook build failures remain unresolved
