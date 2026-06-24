# Component Library — CLAUDE.md

## Project Overview

This is a **production-ready design system component library** built with [StencilJS](https://stenciljs.com/) in an NX monorepo. StencilJS compiles framework-agnostic **web components** (Custom Elements v1) and generates framework-specific wrapper packages for Angular, React, and Vue via Stencil output targets.

- **Namespace**: `my-org` — Stencil bundle identifier
- **Component prefix**: `ds-` (design system) — e.g. `<ds-button>`
- **npm scope**: `@my-org` — e.g. `@my-org/core`, `@my-org/angular`
- **Package manager**: pnpm workspaces

---

## Monorepo Structure

```
/
├── packages/
│   ├── core/              # StencilJS source — write components here
│   ├── angular/           # Auto-generated Angular wrappers (do not edit src/)
│   ├── react/             # Auto-generated React wrappers (do not edit src/)
│   └── vue/               # Auto-generated Vue 3 wrappers (do not edit src/)
├── apps/
│   └── storybook/         # Component documentation & dev environment
├── nx.json                # NX workspace config & task defaults
├── package.json           # Root workspace scripts
├── pnpm-workspace.yaml    # pnpm workspace definition
├── tsconfig.base.json     # Shared TS config & path aliases
└── CLAUDE.md
```

**Key rule**: All component source lives in `packages/core/src/components/`. The `packages/angular/`, `packages/react/`, and `packages/vue/` `src/` directories are **auto-generated** by `npx stencil build` — never edit them manually.

---

## Development Commands

All commands run from the **workspace root** unless noted.

### Build

```bash
# Build core (also regenerates Angular/React/Vue wrappers)
nx build core
# or directly:
cd packages/core && npx stencil build

# Dev build (faster, skips optimization)
cd packages/core && npx stencil build --dev

# Watch mode + local dev server
cd packages/core && npx stencil build --dev --watch --serve
```

### Test

```bash
# Unit tests (spec)
cd packages/core && npx stencil test --spec

# E2E tests
cd packages/core && npx stencil test --e2e

# Via NX
nx test core
```

### Storybook

```bash
nx run storybook:storybook
# or:
cd apps/storybook && npx storybook dev -p 6006
```

### Lint

```bash
nx lint core
```

---

## Component Authoring Guide

### Creating a New Component

1. Create a folder under `packages/core/src/components/<ds-component-name>/`
2. Files to create:
   - `<ds-component-name>.tsx` — component class
   - `<ds-component-name>.css` — scoped styles (Shadow DOM)
   - `<ds-component-name>.spec.tsx` — unit tests
   - `<ds-component-name>.e2e.ts` — E2E test stub
3. Run `cd packages/core && npx stencil build --dev` to generate wrappers

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Tag name | `ds-` prefix, kebab-case | `ds-button`, `ds-input` |
| File name | match tag name | `ds-button.tsx` |
| Class name | PascalCase, no prefix | `DsButton` |
| Event names | camelCase, `ds` prefix | `dsClick`, `dsChange` |
| CSS variables | `--ds-[component]-[property]` | `--ds-button-bg` |

### Component Skeleton

```tsx
import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'ds-my-component',
  styleUrl: 'ds-my-component.css',
  shadow: true,                     // always true
})
export class DsMyComponent {
  @Prop() label: string = '';       // public API
  @Event() dsChange: EventEmitter<string>;  // events prefixed ds

  render() {
    return <div class="my-component">{this.label}</div>;
  }
}
```

### CSS Conventions

- Use **Shadow DOM** — styles are scoped automatically
- Expose customization via CSS custom properties (`--ds-*`)
- Fall back to global design tokens from `src/global/global.css`
- No hardcoded colors — always use CSS variables

```css
:host {
  display: block;
}

.my-component {
  color: var(--ds-my-component-color, var(--ds-color-primary));
  background: var(--ds-my-component-bg, transparent);
}
```

### Design Tokens & Style Standards

> **All visual decisions are governed by [`DESIGN.md`](./DESIGN.md).** Read it before authoring or reviewing any component. The rules below are a summary only — `DESIGN.md` is authoritative.

Key rules from `DESIGN.md`:

- **Tokens only** — never hardcode colors, spacing, radii, shadows, or durations. Reference `--ds-*` CSS custom properties exclusively.
- **Spacing** — use the numbered scale (`--ds-space-1` through `--ds-space-24`). The legacy `--ds-spacing-xs/sm/md/lg/xl` aliases still work but must not be used in new code.
- **Sizing** — interactive components expose `size="sm|md|lg"` (heights 32/40/48 px). Default is always `md`.
- **Variants** — standard set is `primary | secondary | ghost | outline | danger | success`.
- **All six interaction states required** — default, hover, focus-visible, active, disabled, loading.
- **Reduced motion** — every animated element wraps transitions in `@media (prefers-reduced-motion: reduce)`.
- **Dark mode** — handled entirely in `global.css` via `prefers-color-scheme: dark` and `[data-theme="dark"]`. Components reference semantic tokens and inherit dark values automatically.
- **Accessibility** — WCAG 2.2 AA minimum. Focus rings must always be visible; touch targets ≥ 44 × 44 px.

The full token list (colors, typography, spacing, radii, shadows, motion) is in the [CSS Token Reference](./DESIGN.md#css-token-reference) section of `DESIGN.md`.

---

## Output Target Conventions

The `stencil.config.ts` (in `packages/core/`) generates:

| Output | Path | Purpose |
|--------|------|---------|
| `dist` | `packages/core/dist/` | Web Components (ESM + CJS), lazy-loaded |
| `dist-custom-elements` | `packages/core/dist/components/` | Standalone custom elements |
| `docs-readme` | `packages/core/src/components/**/readme.md` | Per-component auto-docs |
| Angular proxies | `packages/angular/src/directives/` | Angular wrapper directives |
| React proxies | `packages/react/src/components/stencil-generated/` | React wrapper components |
| Vue proxies | `packages/vue/src/components/stencil-generated/` | Vue 3 wrapper components |

**Publishing**: Each package under `packages/` is independently publishable to npm under the `@my-org` scope. Increment versions with `pnpm version` per package before publishing.

---

## Important Constraints

1. **No framework logic in `packages/core`** — it must remain framework-agnostic. Never import Angular, React, or Vue inside the core package.
2. **Shadow DOM always on** — `shadow: true` in every `@Component` decorator.
3. **CSS variables only** — no hardcoded color values; everything via `--ds-*` custom properties.
4. **`ds-` prefix required** — all component tags must start with `ds-`.
5. **Event prefix `ds`** — all `@Event()` emitters use `dsEventName` camelCase naming.
6. **No direct DOM manipulation** — use Stencil lifecycle hooks (`componentDidLoad`, `componentDidUpdate`) and refs (`@Element`) if DOM access is truly required; never query the global document.
7. **Auto-generated files** — `packages/angular/src/`, `packages/react/src/components/stencil-generated/`, and `packages/vue/src/components/stencil-generated/` are owned by the Stencil build. Git-ignore them (see `.gitignore`).
8. **pnpm only** — do not use npm or yarn; workspace linking depends on pnpm.
9. **[`DESIGN.md`](./DESIGN.md) compliance required** — every component must satisfy the color, typography, spacing, interaction-state, motion, and accessibility standards defined there. A component that violates `DESIGN.md` is not ready to ship, regardless of functional correctness.

---

## Skills Available

The following project-level skills are available in `.claude/skills/`:

| Skill | Purpose |
|-------|---------|
| `structured-handoff` | **Start every session with READ mode; end every skill with WRITE mode** — maintains work continuity across sessions |
| `stencil-bootstrap` | Verify project config and build before any component work |
| `stencil-component-build` | Scaffold a new component end-to-end |
| `stencil-unit-test` | Write and run spec (unit) tests with `newSpecPage` |
| `stencil-e2e-test` | Write and run Playwright end-to-end tests in a real browser |
| `storybook-component` | Add a Storybook story for a component |
| `stencil-issue-tracker` | Track and fix recurring build/runtime issues |
| `component-library-mcp` | MCP resource access for component metadata |
| `framework-integration-testing` | Write and run unit tests for Angular, React, and Vue wrapper packages |

### Session Start Protocol

Every new session **must** begin with these two steps before any other skill runs:

1. **`structured-handoff` READ mode** — restore prior context from `.claude/skills/structured-handoff/references/`
2. **`stencil-bootstrap`** — verify project health and capture current conventions

### Skill Completion Protocol

Every pipeline skill (stencil-component-build, stencil-unit-test, stencil-e2e-test, storybook-component, framework-integration-testing) **must** end with:

1. **`stencil-issue-tracker` post-error** (if any errors were self-corrected)
2. **`structured-handoff` WRITE mode** — persist the five-field handoff report

## Framework Integration Test Apps

Three test apps exist for verifying that component wrappers work correctly in each framework:

| App | Location | Runner | Tests |
|-----|----------|--------|-------|
| Angular | `apps/angular-test/` | Jest + jest-preset-angular | `nx test angular-test` |
| React | `apps/react-test/` | Vitest + @testing-library/react | `nx test react-test` |
| Vue | `apps/vue-test/` | Vitest + @vue/test-utils | `nx test vue-test` |

Add a test file to each app whenever a new component is added to `packages/core/`. Use the `framework-integration-testing` skill to scaffold the tests.
