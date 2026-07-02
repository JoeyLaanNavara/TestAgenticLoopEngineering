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
  /** Short description — appears in auto-generated docs */
  @Prop() propName: string = 'default';

  /** Whether the component is disabled */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Emitted when the value changes */
  @Event() ds[ComponentName]Change: EventEmitter<string>;

  render() {
    return (
      <Host
        class={{
          'ds-[name]': true,
          [`ds-[name]--${this.propName}`]: true,
          'ds-[name]--disabled': this.disabled,
        }}
      >
        <slot />
      </Host>
    );
  }
}
```

**Rules:**
- Always use `<Host>` as the root element; `shadow: true` always
- JSDoc comment on every `@Prop` and `@Event`
- Use `{ reflect: true }` on boolean/ARIA props that need HTML attribute mirroring
- Event names use `ds` prefix: `dsButtonClick`, never `click`
- Class name: `Ds[ComponentName]`

### `packages/core/src/components/[tag]/[tag].css`

> **⚠️ Critical: Shadow DOM selector rule**
>
> `<Host class={{ 'ds-[name]--variant': true }}>` puts the class on the **custom element itself** (the shadow host), NOT on a child inside the shadow tree.
>
> - `.ds-[name]--variant` → matches nothing (looks for a shadow-tree child)
> - `:host(.ds-[name]--variant)` → correct (matches the host when it has the class)
>
> | What has the class | Correct selector |
> |-------------------|-----------------|
> | `<Host>` (custom element) | `:host` or `:host(.class)` |
> | Inner `<div class="body">` | `.body` |

> **⚠️ Critical: Slotted content text color**
>
> Slotted content lives in the **light DOM** (the consumer's markup). Shadow CSS does not apply to it directly.
> If `:host` does not explicitly set `color`, slotted `<p>`, `<span>`, etc. will inherit the browser default
> (black), which breaks dark-mode cards completely (black text on dark background).
>
> **Always set `color` on `:host`** so the cascade reaches slotted children:
> ```css
> :host {
>   color: var(--ds-[name]-text-color);
> }
> ```

```css
/**
 * @prop --ds-[name]-bg: Surface background
 * @prop --ds-[name]-text-color: Text color (cascades to slotted content)
 * @prop --ds-[name]-border-color: Border color
 * @prop --ds-[name]-radius: Corner radius
 */

:host {
  --ds-[name]-bg:           var(--ds-color-surface, #ffffff);
  --ds-[name]-text-color:   var(--ds-color-text, #0f172a);
  --ds-[name]-border-color: var(--ds-color-border, #e2e8f0);
  --ds-[name]-radius:       var(--ds-radius-md, 0.375rem);

  display: inline-block;
  box-sizing: border-box;

  /* Apply base visual styles on :host so they render. Do NOT put them on .wrapper. */
  background-color: var(--ds-[name]-bg);
  /* Set color here so slotted light-DOM children inherit the correct theme color */
  color: var(--ds-[name]-text-color);
  border-radius: var(--ds-[name]-radius);
}

/* Variant classes are on <Host> → use :host(.class) */
:host(.ds-[name]--variant-name) {
  --ds-[name]-bg: var(--ds-color-primary-subtle, #eff6ff);
}

/* Reflected boolean attributes → :host([attr]) */
:host([disabled]) {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

/* Inner shadow children → normal class selectors */
.inner-element {
  color: inherit; /* let :host color cascade */
}
```

### `packages/core/src/components/[tag]/index.ts`

```typescript
export { Ds[ComponentName] } from './[tag]';
```

---

## PHASE 3: Verify Build

```bash
nx run core:build:dev 2>&1
```

Self-correction loop until exit 0 with no `error` / `ERR` lines. Common fixes:
- Type mismatch → fix `.tsx`
- Missing import (`h`, `Host`, `EventEmitter`) → add import
- CSS file not found → verify `styleUrl` matches filename
- Barrel conflict → check `src/index.ts`

**Loop Budget** (see [`../_shared/loop-budget.md`](../_shared/loop-budget.md)): two failures are the *same error* only if `node scripts/loop/same-error.mjs` returns the same key. Retry a given error at most **3×**; stop after **10** total fix attempts. On every resolved error you **must** log it via `stencil-issue-tracker` POST-ERROR — not optional. If the budget is exceeded, escalate: log the blocker, run `bash scripts/loop/rollback.sh create <tag>`, write a `blocked` structured-handoff, and stop.

---

## PHASE 4: Update Barrel Export

```bash
ls packages/core/src/index.ts 2>/dev/null
```

If found, append: `export * from './components/[tag]';`

---

## PHASE 5: Visual Self-Verification Loop

**Mandatory. A passing build does not mean a correct-looking component.**

This loop runs after Storybook stories exist (see `storybook-component` skill). Keep iterating until every check below passes.

### Step 1 — Take a screenshot

Start Storybook dev server and take a screenshot of the Default story:

```bash
source ~/.nvm/nvm.sh && nvm use 20
# Start in background
cd apps/storybook && pnpm exec storybook dev -p 6006 --ci &
until curl -s http://localhost:6006 > /dev/null 2>&1; do sleep 2; done
```

Then use the Claude Preview MCP or browser MCP:
- URL: `http://localhost:6006/iframe.html?id=design-system-[componentname]--default&viewMode=story`
- Take a screenshot and visually inspect the result

### Step 2 — Evaluate against the checklist

**Structural checklist** — does it look like the industry-standard version of this component type?

| Component type | Required visual markers |
|----------------|------------------------|
| Card | Visible border OR shadow; background distinct from page canvas; internal padding |
| Button | Solid or bordered background; readable label; cursor pointer |
| Input | Visible border; legible placeholder; focus ring |
| Badge | Colored background; rounded corners; tight padding |
| Alert | Left accent border or colored background |

**Universal checklist (every component):**
- [ ] Background is distinct from the Storybook canvas (white-on-white = invisible card)
- [ ] Body/slot text is readable against the card background (not default black on dark surface)
- [ ] Heading text is readable against the card background
- [ ] Dividers and borders are perceptible (not same color as background)
- [ ] Padding gives the component visible breathing room
- [ ] Hover/focus states are perceptible on interactive components

**Contrast & accessibility checklist (non-negotiable):**
- [ ] **WCAG AA contrast** — normal body text must be ≥ 4.5:1 against its background
- [ ] **WCAG AA contrast** — large/bold headings must be ≥ 3:1 against their background
- [ ] **Dark mode** — if the canvas is dark, ALL text (including slotted content) must be light, not black
- [ ] **Light mode** — if the canvas is light, ALL text must be dark, not white
- [ ] **Never rely on color alone** to convey information — use shape, label, or icon alongside color
- [ ] **Colorblind safe** — do not use red/green as the only distinction between states; test mentally by imagining the reds and greens as the same gray

To compute contrast ratio manually: `(L1 + 0.05) / (L2 + 0.05)` where L is relative luminance.
Quick check: `#0f172a` (dark) on `#273548` (dark blue) → both dark → **fail**. `#f1f5f9` (near white) on `#273548` → **pass**.

### Step 3 — Fix and loop

If any check fails:

1. **Selector mismatch** (styles not applying at all)
   - Classes on `<Host>` → change `.ds-[name]--class` to `:host(.ds-[name]--class)` in CSS
   - Verify with: `page.root.classList.contains('ds-[name]--class')` in a spec test

2. **Slotted text wrong color** (black text on dark background)
   - Add `color: var(--ds-[name]-text-color)` to `:host {}`
   - `--ds-[name]-text-color` must fall back to `--ds-color-text` (which dark-mode overrides to `#f1f5f9`)

3. **Token not resolving** (fallback to browser default)
   - Confirm `global.css` is imported in `apps/storybook/.storybook/preview.ts`
   - Add explicit hardcoded fallbacks: `var(--ds-color-text, #0f172a)`

4. **Contrast fails**
   - Replace subtle token (e.g. `--ds-color-text-subtle` = `#64748b`) with full-contrast token (`--ds-color-text`)
   - Or darken/lighten the background token used

5. Rebuild: `cd packages/core && pnpm exec stencil build --dev`
6. Retake screenshot → re-evaluate checklist → loop, but **bounded to 5 visual cycles** (the subjective-stage cap in [`../_shared/loop-budget.md`](../_shared/loop-budget.md)). If still failing after 5, stop and record the remaining items as a `manual-review-required` note in the handoff — do not loop forever on a subjective check.

### Step 4 — Objective gate (the terminal "done" signal)

The checklist above is human guidance; the machine-checkable gate that an autonomous run terminates on is `design-lint`:

```bash
node scripts/design-lint.mjs [tag]
```

It enforces the mechanical `DESIGN.md` rules (tokens-only, known `--ds-*` tokens, `:host` present, `prefers-reduced-motion` wrapper around transitions/animations) and computes WCAG contrast where tokens resolve to hex.

**The component is complete when `design-lint` reports `pass: true` (exit 0)** and the ≤5-cycle visual pass surfaced no blocking issue. A `design-lint` failure means NOT done — fix the reported violations (under the Loop Budget) and re-run.

---

## Complete

```
✅ ds-[name] component created
   packages/core/src/components/ds-[name]/ds-[name].tsx
   packages/core/src/components/ds-[name]/ds-[name].css
   packages/core/src/components/ds-[name]/index.ts
✅ Dev build passing
✅ Visual verification: screenshot passes all structural, contrast, and colorblind checks
```

---

## Definition of Success

- [ ] All three files created: `.tsx`, `.css`, `index.ts`
- [ ] `<Host>` as root element; `shadow: true`; JSDoc on every `@Prop` / `@Event`
- [ ] `:host(.class)` selectors used for all host-applied variant classes
- [ ] `color` property set on `:host` so slotted content inherits the correct theme color
- [ ] All themeable values use `--ds-*` tokens with hardcoded fallbacks
- [ ] `nx run core:build:dev` exits with no errors
- [ ] Barrel export updated if `src/index.ts` exists
- [ ] **Screenshot passes the visual checklist** — component looks like its industry-standard counterpart
- [ ] **WCAG AA contrast passes** for all text/background combinations in both light and dark mode
- [ ] **No color-only information** — shape, label, or icon used alongside color cues
