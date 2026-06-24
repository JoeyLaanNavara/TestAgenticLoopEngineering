# Design System — Style Guide

> **Authority**: This document is the canonical source of truth for all visual decisions in this component library. `CLAUDE.md` requires every component to follow these standards. When implementing or reviewing any `ds-*` component, verify compliance with every applicable section here.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border Radius](#border-radius)
6. [Elevation & Shadows](#elevation--shadows)
7. [Motion & Animation](#motion--animation)
8. [Iconography](#iconography)
9. [Component Anatomy](#component-anatomy)
10. [Interaction States](#interaction-states)
11. [Dark Mode](#dark-mode)
12. [Component Theming Specification](#component-theming-specification)
13. [Accessibility](#accessibility)
14. [CSS Token Reference](#css-token-reference)
15. [global.css Maintenance Rules](#globalcss-maintenance-rules)

---

## Design Philosophy

This library follows four principles that must never be traded against each other:

| Principle | What it means in practice |
|-----------|--------------------------|
| **Clarity** | Every element communicates its purpose without instruction. Labels are terse but unambiguous. |
| **Efficiency** | Interactions complete in the fewest steps. Defaults are always the correct choice for 80 % of use cases. |
| **Consistency** | Identical affordances behave identically across every component. Same token, same result. |
| **Accessibility** | WCAG 2.2 AA is the floor, not the ceiling. Motion is always optional. |

These principles are ordered by priority. When they conflict, clarity wins over efficiency, efficiency wins over consistency, and accessibility is a hard constraint that overrides everything else.

---

## Color System

### Palette Structure

The palette is built in three tiers:

1. **Primitives** — raw named values (never reference directly in components)
2. **Semantic tokens** — purpose-named aliases built from primitives (always use these)
3. **Component tokens** — component-scoped overrides that fall back to semantic tokens

### Semantic Color Tokens

#### Brand / Interactive

| Token | Light value | Dark value | Usage |
|-------|------------|-----------|-------|
| `--ds-color-primary` | `#2563EB` | `#3B82F6` | Primary actions, links, focus rings |
| `--ds-color-primary-hover` | `#1D4ED8` | `#60A5FA` | Hover state of primary |
| `--ds-color-primary-active` | `#1E40AF` | `#93C5FD` | Pressed state of primary |
| `--ds-color-primary-subtle` | `#EFF6FF` | `#1E3A5F` | Tinted backgrounds for primary context |
| `--ds-color-primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text/icon on primary background |

#### Neutrals (Gray scale)

| Token | Light value | Dark value | Usage |
|-------|------------|-----------|-------|
| `--ds-color-neutral-50` | `#F8FAFC` | `#0F172A` | Page/canvas background |
| `--ds-color-neutral-100` | `#F1F5F9` | `#1E293B` | Subtle background, stripes |
| `--ds-color-neutral-200` | `#E2E8F0` | `#334155` | Borders, dividers |
| `--ds-color-neutral-300` | `#CBD5E1` | `#475569` | Disabled borders |
| `--ds-color-neutral-400` | `#94A3B8` | `#64748B` | Placeholder text |
| `--ds-color-neutral-500` | `#64748B` | `#94A3B8` | Helper text, captions |
| `--ds-color-neutral-600` | `#475569` | `#CBD5E1` | Secondary body text |
| `--ds-color-neutral-700` | `#334155` | `#E2E8F0` | Primary body text |
| `--ds-color-neutral-800` | `#1E293B` | `#F1F5F9` | Headings |
| `--ds-color-neutral-900` | `#0F172A` | `#F8FAFC` | High-emphasis text |

#### Semantic States

| Token | Light value | Dark value | Usage |
|-------|------------|-----------|-------|
| `--ds-color-success` | `#16A34A` | `#4ADE80` | Confirmed, saved, completed |
| `--ds-color-success-subtle` | `#F0FDF4` | `#052E16` | Success tinted background |
| `--ds-color-success-foreground` | `#FFFFFF` | `#052E16` | Text on success background |
| `--ds-color-warning` | `#D97706` | `#FBBF24` | Caution, degraded, pending |
| `--ds-color-warning-subtle` | `#FFFBEB` | `#2D1F00` | Warning tinted background |
| `--ds-color-warning-foreground` | `#FFFFFF` | `#2D1F00` | Text on warning background |
| `--ds-color-danger` | `#DC2626` | `#F87171` | Error, destructive, invalid |
| `--ds-color-danger-subtle` | `#FEF2F2` | `#2D0A0A` | Danger tinted background |
| `--ds-color-danger-foreground` | `#FFFFFF` | `#2D0A0A` | Text on danger background |
| `--ds-color-info` | `#0891B2` | `#22D3EE` | Informational, neutral notice |
| `--ds-color-info-subtle` | `#ECFEFF` | `#042F2E` | Info tinted background |
| `--ds-color-info-foreground` | `#FFFFFF` | `#042F2E` | Text on info background |

#### Surfaces & Text

| Token | Light value | Dark value | Usage |
|-------|------------|-----------|-------|
| `--ds-color-surface` | `#FFFFFF` | `#1E293B` | Default component surface |
| `--ds-color-surface-raised` | `#FFFFFF` | `#2D3F55` | Elevated surfaces (cards, dropdowns) |
| `--ds-color-surface-overlay` | `#FFFFFF` | `#374B61` | Modals, popovers |
| `--ds-color-border` | `#E2E8F0` | `#334155` | Default component border |
| `--ds-color-border-strong` | `#94A3B8` | `#64748B` | Emphasized border |
| `--ds-color-text` | `#0F172A` | `#F8FAFC` | Primary body text |
| `--ds-color-text-subtle` | `#64748B` | `#94A3B8` | Secondary / helper text |
| `--ds-color-text-disabled` | `#94A3B8` | `#475569` | Disabled state text |
| `--ds-color-text-inverse` | `#FFFFFF` | `#0F172A` | Text on dark/colored surfaces |

### Color Rules

- **Never hardcode hex values** in component CSS. Reference `--ds-*` tokens only.
- **Contrast ratios**: normal text ≥ 4.5 : 1, large text ≥ 3 : 1, UI components ≥ 3 : 1 (WCAG AA).
- **Semantic meaning is locked**: don't reuse `--ds-color-danger` for decorative red elements — use a neutral instead.
- **Brand saturation cap**: primary-colored surfaces must never exceed 10 % of any screen's visual weight.

---

## Typography

### Font Stack

```css
--ds-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                  'Helvetica Neue', Arial, sans-serif;
--ds-font-family-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
                       ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

Inter is the preferred display font. Load it from your application shell; `packages/core` does not bundle web fonts.

### Type Scale

All sizes use `rem` to respect the user's browser font-size preference.

| Token | Value | px equiv | Usage |
|-------|-------|---------|-------|
| `--ds-font-size-xs` | `0.75rem` | 12 px | Labels, captions, badges |
| `--ds-font-size-sm` | `0.875rem` | 14 px | Secondary text, form helpers |
| `--ds-font-size-md` | `1rem` | 16 px | **Default body text** |
| `--ds-font-size-lg` | `1.125rem` | 18 px | Sub-headings, emphasized body |
| `--ds-font-size-xl` | `1.25rem` | 20 px | Section headings |
| `--ds-font-size-2xl` | `1.5rem` | 24 px | Card titles, dialog headings |
| `--ds-font-size-3xl` | `1.875rem` | 30 px | Page headings |
| `--ds-font-size-4xl` | `2.25rem` | 36 px | Hero / marketing headings |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-font-weight-regular` | `400` | Body text, helper text |
| `--ds-font-weight-medium` | `500` | Interactive labels, field labels |
| `--ds-font-weight-semibold` | `600` | Headings, emphasized content |
| `--ds-font-weight-bold` | `700` | High-emphasis, CTAs |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-line-height-tight` | `1.25` | Headings only |
| `--ds-line-height-snug` | `1.375` | Short UI labels |
| `--ds-line-height-normal` | `1.5` | **Default body copy** |
| `--ds-line-height-relaxed` | `1.625` | Long-form readable text |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-letter-spacing-tight` | `-0.025em` | Large display headings |
| `--ds-letter-spacing-normal` | `0em` | Body text default |
| `--ds-letter-spacing-wide` | `0.025em` | All-caps labels, badges |
| `--ds-letter-spacing-wider` | `0.05em` | Uppercase micro-labels |

### Typography Rules

- **Never use fewer than 2 distinct type sizes** in a component that contains hierarchy (e.g. label + helper text).
- **Minimum body font size is `--ds-font-size-sm`** (14 px). Never render interactive text smaller.
- **Do not bold body paragraphs** — use `--ds-font-weight-medium` (500) for subtle emphasis; bold (700) is reserved for headings and CTAs.
- **Line length limit**: text blocks inside components should target 60–80 characters. Use `max-ch` constraints where the component controls layout.

---

## Spacing & Layout

### Base Unit

All spacing is derived from a **4 px (0.25 rem) base unit**. Never use arbitrary values — only multiples of this base.

### Spacing Scale

| Token | Value | px | Use case |
|-------|-------|----|----------|
| `--ds-space-0` | `0` | 0 | Reset / flush |
| `--ds-space-1` | `0.25rem` | 4 | Micro gaps (icon-to-label) |
| `--ds-space-2` | `0.5rem` | 8 | Tight element groupings |
| `--ds-space-3` | `0.75rem` | 12 | Default inner padding (sm size) |
| `--ds-space-4` | `1rem` | 16 | **Default inner padding (md size)** |
| `--ds-space-5` | `1.25rem` | 20 | Comfortable padding |
| `--ds-space-6` | `1.5rem` | 24 | Section-level padding |
| `--ds-space-8` | `2rem` | 32 | Between major sections |
| `--ds-space-10` | `2.5rem` | 40 | Component vertical rhythm |
| `--ds-space-12` | `3rem` | 48 | Large component gaps |
| `--ds-space-16` | `4rem` | 64 | Page-level spacing |
| `--ds-space-20` | `5rem` | 80 | Hero / large white space |
| `--ds-space-24` | `6rem` | 96 | Maximum section spacing |

> The legacy tokens `--ds-spacing-xs/sm/md/lg/xl` remain for backwards compatibility and map to `--ds-space-1/2/4/6/8` respectively. New components must use the numbered scale.

### Sizing (Component Dimensions)

Three standard sizes for interactive components:

| Size | Height | Horizontal padding | Font size token |
|------|--------|-------------------|----------------|
| `sm` | 32 px | `--ds-space-3` | `--ds-font-size-sm` |
| `md` (default) | 40 px | `--ds-space-4` | `--ds-font-size-md` |
| `lg` | 48 px | `--ds-space-5` | `--ds-font-size-lg` |

Implement these via CSS custom properties so host apps can override:

```css
:host {
  --_height: var(--ds-comp-height, 40px);
  --_pad-x: var(--ds-comp-pad-x, var(--ds-space-4));
  --_font-size: var(--ds-comp-font-size, var(--ds-font-size-md));
}
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-radius-none` | `0` | Sharp corners (tables, code blocks) |
| `--ds-radius-sm` | `0.25rem` | 4 px — Badges, chips, small elements |
| `--ds-radius-md` | `0.375rem` | 6 px — **Default for most components** |
| `--ds-radius-lg` | `0.5rem` | 8 px — Cards, panels |
| `--ds-radius-xl` | `0.75rem` | 12 px — Modals, drawers |
| `--ds-radius-2xl` | `1rem` | 16 px — Large cards, hero areas |
| `--ds-radius-full` | `9999px` | Pills, avatar circles, toggle tracks |

**Rule**: Use `--ds-radius-md` as the default. Use `--ds-radius-full` only for pill/circle shapes — never for rectangular containers.

---

## Elevation & Shadows

Shadows communicate vertical depth. Use the lowest level that establishes sufficient separation.

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-shadow-none` | `none` | Flat elements (no elevation) |
| `--ds-shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle lift (buttons, inputs) |
| `--ds-shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)` | Cards, form fields |
| `--ds-shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)` | Dropdowns, tooltips |
| `--ds-shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)` | Modals, drawers |
| `--ds-shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10)` | Command palettes, large overlays |
| `--ds-shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Inset inputs, pressed states |

**Elevation mapping**:
- Level 0 (flat): `none` — body content, inline elements
- Level 1: `--ds-shadow-xs` — interactive controls
- Level 2: `--ds-shadow-sm` — cards, panels
- Level 3: `--ds-shadow-md` — dropdowns, date pickers
- Level 4: `--ds-shadow-lg` — modals, side sheets
- Level 5: `--ds-shadow-xl` — command palette, global search

**Dark mode**: Elevation in dark mode is communicated with **surface color lightness** (`--ds-color-surface-raised`, `--ds-color-surface-overlay`) rather than shadow opacity. Reduce shadow opacity by 50 % in dark mode.

---

## Motion & Animation

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-duration-instant` | `50ms` | Micro-feedback (ripple start) |
| `--ds-duration-fast` | `100ms` | State changes (color, border) |
| `--ds-duration-normal` | `150ms` | **Default** hover/focus transitions |
| `--ds-duration-moderate` | `200ms` | Expanding elements (accordion, dropdown open) |
| `--ds-duration-slow` | `300ms` | Enter animations (modal, toast slide-in) |
| `--ds-duration-slower` | `500ms` | Page-level transitions |

### Easing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ds-ease-linear` | `linear` | Progress bars, loading indicators |
| `--ds-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations (element leaving) |
| `--ds-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | **Enter animations (element arriving)** |
| `--ds-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes (hover, focus) |
| `--ds-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions (rare) |

> `--ds-transition-speed` (legacy) maps to `--ds-duration-normal`. `--ds-transition-easing` (legacy) maps to `--ds-ease-in-out`.

### Transition Shorthand Pattern

Every component that animates must use this pattern:

```css
.element {
  transition:
    color var(--ds-duration-normal) var(--ds-ease-in-out),
    background-color var(--ds-duration-normal) var(--ds-ease-in-out),
    border-color var(--ds-duration-normal) var(--ds-ease-in-out),
    box-shadow var(--ds-duration-normal) var(--ds-ease-in-out),
    opacity var(--ds-duration-normal) var(--ds-ease-in-out);
}
```

Never use `transition: all` — it degrades performance and creates unintended side effects.

### Reduced Motion

Every animation must be wrapped in a reduced-motion media query:

```css
@media (prefers-reduced-motion: reduce) {
  .element {
    transition: none;
    animation: none;
  }
}
```

---

## Iconography

- **Format**: SVG only. No icon fonts.
- **Default size**: `1em` (inherits from surrounding text size via `font-size`).
- **Standard sizes**: `16px` (inline), `20px` (default UI), `24px` (large), `32px` (display).
- **Stroke width**: 1.5 px for 16–20 px icons; 1.5–2 px for 24 px+.
- **Color**: Icons inherit `currentColor` — never hardcode fill/stroke color on the SVG. This ensures correct behavior in all themes and states.
- **Accessibility**: Decorative icons use `aria-hidden="true"`. Standalone icons (no label) require `aria-label` or an adjacent visually-hidden label.
- **Touch targets**: Interactive icons must have a minimum 44 × 44 px touch target (pad with CSS if the icon itself is smaller).

---

## Component Anatomy

Every interactive component follows this layered structure:

```
:host (layout contract — display, sizing)
  └── .root (visual surface — background, border, radius, shadow)
        ├── .prefix (optional — icon or adornment)
        ├── .content (required — primary label or slot)
        └── .suffix (optional — icon, badge, or adornment)
```

### Naming Convention for Internal Classes

| Class | Purpose |
|-------|---------|
| `.root` | Outermost rendered element; owns visual surface |
| `.label` | Primary text content |
| `.prefix` | Leading slot content (icon, avatar) |
| `.suffix` | Trailing slot content (icon, chevron, badge) |
| `.helper` | Secondary descriptive text below the component |
| `.error` | Validation error message |
| `.overlay` | Backdrop or scrim element |
| `.track` | Container that a thumb/handle slides within (toggle, slider) |
| `.thumb` | The moving handle element (toggle, slider) |

Modifier classes follow BEM double-dash: `.root--sm`, `.root--disabled`, `.root--loading`.

### Variant System

Every component exposes variants via a `variant` prop. Standard variants:

| Variant | Intent | When to use |
|---------|--------|------------|
| `primary` | Highest emphasis | One per view, main call-to-action |
| `secondary` | Medium emphasis | Supporting actions |
| `ghost` | Low emphasis | Tertiary, icon-only, toolbar items |
| `outline` | Bordered, no fill | Balanced emphasis without full fill |
| `danger` | Destructive action | Delete, remove, cancel (irreversible) |
| `success` | Confirmative | Approve, accept (sparingly) |

### Size System

Every interactive component exposes a `size` prop: `'sm' | 'md' | 'lg'`. Default is always `'md'`.

---

## Interaction States

Every interactive component **must** implement all six states. Missing a state is a bug.

| State | CSS selector | Visual treatment |
|-------|-------------|-----------------|
| **Default** | `:host` | Base surface and border |
| **Hover** | `:hover:not([disabled])` | Lighten or darken background by ~8 %; show `cursor: pointer` |
| **Focus-visible** | `:focus-visible` | 2 px `outline` using `--ds-color-primary`; `outline-offset: 2px`; **never** `outline: none` |
| **Active / Pressed** | `:active:not([disabled])` | Darken background further; translate `0 1px` for buttons |
| **Disabled** | `:host([disabled])`, `[aria-disabled="true"]` | `opacity: 0.5`; `cursor: not-allowed`; `pointer-events: none` on interactive children |
| **Loading** | `:host([loading])` | Spinner replaces or overlays content; component remains sized; disable interaction |

### Focus Ring Rules

- Use `outline`, not `box-shadow`, for focus rings (box-shadow can be obscured by `overflow: hidden`).
- Focus rings must always be visible — never suppress them without providing an equal or better replacement.
- Focus ring color must contrast ≥ 3 : 1 against both the component surface and the page background.

### Hover Lift (optional, contextual)

Cards and panels that represent clickable destinations may use a subtle `box-shadow` increase and `translateY(-1px)` on hover. Only apply this to components that navigate or expand — not to form controls.

---

## Dark Mode

Every component in this library ships with both a **light** and a **dark** appearance. This is not optional — a component that only works in one mode is incomplete.

### How It Works (Shadow DOM + CSS Custom Properties)

CSS custom properties pierce Shadow DOM boundaries. Components never read `prefers-color-scheme` themselves — they only consume `--ds-*` tokens. `global.css` redefines those tokens for dark mode, and all components update automatically.

```css
/* global.css — authoritative light + dark declarations */

/* ── Light (default) ─────────────────────────────── */
:root {
  --ds-color-surface:         #ffffff;
  --ds-color-surface-raised:  #ffffff;
  --ds-color-surface-overlay: #ffffff;
  --ds-color-border:          #e2e8f0;
  --ds-color-border-strong:   #94a3b8;
  --ds-color-text:            #0f172a;
  --ds-color-text-subtle:     #64748b;
  --ds-color-text-disabled:   #94a3b8;
  --ds-color-text-inverse:    #ffffff;

  --ds-color-primary:         #2563eb;
  --ds-color-primary-hover:   #1d4ed8;
  --ds-color-primary-active:  #1e40af;
  --ds-color-primary-subtle:  #eff6ff;

  --ds-color-success:         #16a34a;
  --ds-color-success-subtle:  #f0fdf4;
  --ds-color-warning:         #d97706;
  --ds-color-warning-subtle:  #fffbeb;
  --ds-color-danger:          #dc2626;
  --ds-color-danger-subtle:   #fef2f2;
  --ds-color-info:            #0891b2;
  --ds-color-info-subtle:     #ecfeff;

  /* Shadows — standard opacity */
  --ds-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --ds-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10);
  --ds-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10);
  --ds-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);
  --ds-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);
}

/* ── Dark ─────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root { --ds-theme: dark; }
}
[data-theme="dark"] { --ds-theme: dark; }

@media (prefers-color-scheme: dark), :root[style*="--ds-theme: dark"], [data-theme="dark"] {
  /* Surfaces — depth via lightness, not heavier shadows */
  --ds-color-surface:         #1e293b;   /* base layer */
  --ds-color-surface-raised:  #273548;   /* cards, panels (one step lighter) */
  --ds-color-surface-overlay: #2f3f56;   /* modals, popovers (two steps lighter) */

  --ds-color-border:          #334155;
  --ds-color-border-strong:   #64748b;

  --ds-color-text:            #f1f5f9;
  --ds-color-text-subtle:     #94a3b8;
  --ds-color-text-disabled:   #475569;
  --ds-color-text-inverse:    #0f172a;

  /* Brand — slightly lighter/more saturated for dark backgrounds */
  --ds-color-primary:         #3b82f6;
  --ds-color-primary-hover:   #60a5fa;
  --ds-color-primary-active:  #93c5fd;
  --ds-color-primary-subtle:  #1e3a5f;

  /* Semantic states */
  --ds-color-success:         #4ade80;
  --ds-color-success-subtle:  #052e16;
  --ds-color-warning:         #fbbf24;
  --ds-color-warning-subtle:  #2d1f00;
  --ds-color-danger:          #f87171;
  --ds-color-danger-subtle:   #2d0a0a;
  --ds-color-info:            #22d3ee;
  --ds-color-info-subtle:     #042f2e;

  /* Shadows — halved opacity; elevation shown via surface color instead */
  --ds-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.40);
  --ds-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.50), 0 1px 2px -1px rgb(0 0 0 / 0.50);
  --ds-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.50), 0 2px 4px -2px rgb(0 0 0 / 0.50);
  --ds-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.50), 0 4px 6px -4px rgb(0 0 0 / 0.50);
  --ds-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.50), 0 8px 10px -6px rgb(0 0 0 / 0.50);
}
```

> **Why the complex selector?** The `@media` query handles OS-level preference; `[data-theme="dark"]` handles a user toggle in the app shell. Both must produce identical token values. No component-level `@media` or attribute checks are ever needed.

### Dark Mode Design Rules

| Rule | Rationale |
|------|-----------|
| Surfaces gain depth via **lighter tones**, not heavier shadows | Dark shadows vanish on dark backgrounds |
| Primary color is **lightened** in dark mode | Darker primaries fail contrast against dark surfaces |
| Semantic state colors (success/danger/warning/info) are **pastel** in dark mode | Saturated colors cause eye strain on dark backgrounds |
| Subtle tints (`-subtle` tokens) use **very dark** values | Inverted from light mode — they are near-black in dark mode |
| Never use `color-scheme: dark` alone | Always pair with token overrides — the property alone does not update custom properties |
| Storybook must render each component in **both modes** | Dark-only or light-only stories are incomplete; use `[data-theme]` wrapper |

---

## Component Theming Specification

This section defines exactly how each component category maps tokens to visual properties in **both light and dark modes**. Every row is a requirement — not a suggestion.

The mapping works as follows: component CSS files reference component-scoped tokens (e.g. `--ds-button-bg`) with fallbacks to semantic tokens (e.g. `var(--ds-color-primary)`). Because semantic tokens are redefined in `global.css` for dark mode, components update automatically with no additional CSS.

---

### Button (`ds-button`)

#### Light mode

| Visual property | Token (component → semantic fallback) | Value |
|----------------|--------------------------------------|-------|
| Background (primary) | `--ds-button-bg` → `--ds-color-primary` | `#2563eb` |
| Background hover | `--ds-button-bg-hover` → `--ds-color-primary-hover` | `#1d4ed8` |
| Background active | `--ds-button-bg-active` → `--ds-color-primary-active` | `#1e40af` |
| Label color | `--ds-button-color` → `--ds-color-primary-foreground` | `#ffffff` |
| Border (primary) | transparent | — |
| Border (outline variant) | `--ds-color-border-strong` | `#94a3b8` |
| Ghost background | transparent | — |
| Ghost hover background | `--ds-color-neutral-100` | `#f1f5f9` |
| Focus ring | `--ds-color-primary` 2 px outline | `#2563eb` |
| Disabled opacity | `0.5` | — |
| Shadow | `--ds-shadow-xs` | subtle |

#### Dark mode (token overrides via `global.css`)

| Visual property | Dark token value | Result |
|----------------|-----------------|--------|
| Background (primary) | `--ds-color-primary` → `#3b82f6` | Lighter blue — readable on dark surfaces |
| Background hover | `--ds-color-primary-hover` → `#60a5fa` | Further lightened |
| Label color | unchanged — `#ffffff` | Still legible |
| Border (outline variant) | `--ds-color-border-strong` → `#64748b` | Lighter for visibility |
| Ghost hover background | `--ds-color-neutral-800` | `#1e293b` — subtle dark tint |
| Focus ring | `--ds-color-primary` → `#3b82f6` | Matches new primary |

#### CSS skeleton

```css
/* ds-button.css */
.btn {
  background-color: var(--ds-button-bg, var(--ds-color-primary));
  color:            var(--ds-button-color, var(--ds-color-primary-foreground));
  border-color:     var(--ds-button-border-color, transparent);
  box-shadow:       var(--ds-button-shadow, var(--ds-shadow-xs));
}
.btn:hover:not(:disabled) {
  background-color: var(--ds-button-bg-hover, var(--ds-color-primary-hover));
}
.btn:focus-visible {
  outline: 2px solid var(--ds-color-primary);
  outline-offset: 2px;
}
/* Ghost variant */
.btn--ghost {
  background-color: transparent;
  color: var(--ds-color-primary);
}
.btn--ghost:hover:not(:disabled) {
  background-color: var(--ds-color-primary-subtle);
}
/* Outline variant */
.btn--outline {
  background-color: transparent;
  color: var(--ds-color-text);
  border: 1px solid var(--ds-color-border-strong);
}
.btn--outline:hover:not(:disabled) {
  background-color: var(--ds-color-neutral-100);
  border-color: var(--ds-color-primary);
}
```

---

### Text Input / Textarea (`ds-input`, `ds-textarea`)

#### Light mode

| Property | Token | Value |
|----------|-------|-------|
| Background | `--ds-color-surface` | `#ffffff` |
| Border | `--ds-color-border` | `#e2e8f0` |
| Border (hover) | `--ds-color-border-strong` | `#94a3b8` |
| Border (focus) | `--ds-color-primary` | `#2563eb` |
| Border (error) | `--ds-color-danger` | `#dc2626` |
| Text | `--ds-color-text` | `#0f172a` |
| Placeholder | `--ds-color-text-subtle` | `#64748b` |
| Label | `--ds-color-text` | `#0f172a` |
| Helper text | `--ds-color-text-subtle` | `#64748b` |
| Error text | `--ds-color-danger` | `#dc2626` |
| Shadow (focus) | `--ds-shadow-inner` + focus ring | subtle inset |

#### Dark mode

| Property | Dark value |
|----------|-----------|
| Background | `--ds-color-surface` → `#1e293b` |
| Border | `--ds-color-border` → `#334155` |
| Border (hover) | `--ds-color-border-strong` → `#64748b` |
| Border (focus) | `--ds-color-primary` → `#3b82f6` |
| Text | `--ds-color-text` → `#f1f5f9` |
| Placeholder | `--ds-color-text-subtle` → `#94a3b8` |
| Error text | `--ds-color-danger` → `#f87171` |

#### CSS skeleton

```css
/* ds-input.css */
.input {
  background-color: var(--ds-input-bg, var(--ds-color-surface));
  border: 1px solid var(--ds-input-border, var(--ds-color-border));
  color: var(--ds-color-text);
}
.input:hover:not(:disabled) {
  border-color: var(--ds-color-border-strong);
}
.input:focus-visible {
  border-color: var(--ds-color-primary);
  outline: 2px solid var(--ds-color-primary);
  outline-offset: -1px; /* inset ring sits on the border */
}
.input--error {
  border-color: var(--ds-color-danger);
}
.input--error:focus-visible {
  outline-color: var(--ds-color-danger);
}
::placeholder {
  color: var(--ds-color-text-subtle);
}
```

---

### Select / Dropdown (`ds-select`)

Same token assignments as `ds-input` for the trigger surface. The dropdown panel maps as:

| Property | Light token | Dark token value |
|----------|-------------|-----------------|
| Panel background | `--ds-color-surface-raised` | `#273548` |
| Panel shadow | `--ds-shadow-md` | elevated |
| Option hover bg | `--ds-color-primary-subtle` | `#1e3a5f` |
| Option selected bg | `--ds-color-primary-subtle` | `#1e3a5f` |
| Option selected text | `--ds-color-primary` | `#3b82f6` |
| Divider | `--ds-color-border` | `#334155` |

---

### Checkbox & Radio (`ds-checkbox`, `ds-radio`)

| Property | Light | Dark |
|----------|-------|------|
| Control border | `--ds-color-border-strong` = `#94a3b8` | `#64748b` |
| Control bg (unchecked) | `--ds-color-surface` = `#ffffff` | `#1e293b` |
| Control bg (checked) | `--ds-color-primary` = `#2563eb` | `#3b82f6` |
| Check/dot color | `--ds-color-primary-foreground` = `#ffffff` | `#ffffff` |
| Label | `--ds-color-text` | `#f1f5f9` |
| Focus ring | `--ds-color-primary` 2 px | `#3b82f6` 2 px |
| Disabled border | `--ds-color-neutral-300` | `#334155` |
| Disabled bg | `--ds-color-neutral-100` | `#1e293b` |

---

### Toggle / Switch (`ds-toggle`)

| Property | Light | Dark |
|----------|-------|------|
| Track (off) | `--ds-color-neutral-300` = `#cbd5e1` | `#334155` |
| Track (on) | `--ds-color-primary` = `#2563eb` | `#3b82f6` |
| Thumb | `#ffffff` | `#f1f5f9` |
| Thumb shadow | `--ds-shadow-sm` | reduced opacity shadow |
| Focus ring | `--ds-color-primary` 2 px | `#3b82f6` 2 px |

---

### Badge / Chip / Tag (`ds-badge`)

Badges use the `-subtle` background with the base color for text, giving contrast without visual noise.

| Variant | Light bg | Light text | Dark bg | Dark text |
|---------|----------|------------|---------|-----------|
| `neutral` | `--ds-color-neutral-100` | `--ds-color-neutral-700` | `#334155` | `#cbd5e1` |
| `primary` | `--ds-color-primary-subtle` | `--ds-color-primary` | `#1e3a5f` | `#3b82f6` |
| `success` | `--ds-color-success-subtle` | `--ds-color-success` | `#052e16` | `#4ade80` |
| `warning` | `--ds-color-warning-subtle` | `--ds-color-warning` | `#2d1f00` | `#fbbf24` |
| `danger` | `--ds-color-danger-subtle` | `--ds-color-danger` | `#2d0a0a` | `#f87171` |
| `info` | `--ds-color-info-subtle` | `--ds-color-info` | `#042f2e` | `#22d3ee` |

Solid variant: use the base color as background, `--ds-color-*-foreground` as text. Same in dark (the foreground token stays `#ffffff`).

---

### Alert / Banner (`ds-alert`)

| Variant | Light bg | Light border | Light icon | Dark bg | Dark border | Dark icon |
|---------|----------|-------------|-----------|---------|------------|----------|
| `info` | `--ds-color-info-subtle` | `--ds-color-info` | `--ds-color-info` | `#042f2e` | `#22d3ee` | `#22d3ee` |
| `success` | `--ds-color-success-subtle` | `--ds-color-success` | `--ds-color-success` | `#052e16` | `#4ade80` | `#4ade80` |
| `warning` | `--ds-color-warning-subtle` | `--ds-color-warning` | `--ds-color-warning` | `#2d1f00` | `#fbbf24` | `#fbbf24` |
| `danger` | `--ds-color-danger-subtle` | `--ds-color-danger` | `--ds-color-danger` | `#2d0a0a` | `#f87171` | `#f87171` |

Left border accent: 3 px solid using the base semantic color token. Text uses `--ds-color-text` (not the semantic color).

---

### Toast / Notification (`ds-toast`)

Toasts use a **reversed** surface — dark in light mode, light in dark mode — to stand out from the page.

| Property | Light | Dark |
|----------|-------|------|
| Background | `--ds-color-neutral-900` = `#0f172a` | `--ds-color-neutral-100` = `#f1f5f9` |
| Text | `--ds-color-neutral-50` = `#f8fafc` | `--ds-color-neutral-900` = `#0f172a` |
| Icon (default) | `--ds-color-neutral-400` | `--ds-color-neutral-600` |
| Border | none | none |
| Shadow | `--ds-shadow-lg` | `--ds-shadow-lg` (increased opacity in dark) |
| Success accent | `--ds-color-success` | `--ds-color-success` (pastel in dark) |
| Danger accent | `--ds-color-danger` | `--ds-color-danger` (pastel in dark) |

---

### Card / Panel (`ds-card`)

| Property | Light | Dark |
|----------|-------|------|
| Background | `--ds-color-surface-raised` = `#ffffff` | `#273548` |
| Border | `--ds-color-border` = `#e2e8f0` | `#334155` |
| Shadow | `--ds-shadow-sm` | `--ds-shadow-sm` (increased opacity) |
| Heading text | `--ds-color-text` | `#f1f5f9` |
| Body text | `--ds-color-text-subtle` | `#94a3b8` |
| Hover (clickable card) | shadow → `--ds-shadow-md`, `translateY(-1px)` | same |
| Divider (inside card) | `--ds-color-border` | `#334155` |

---

### Modal / Dialog (`ds-modal`)

| Property | Light | Dark |
|----------|-------|------|
| Backdrop | `rgb(15 23 42 / 0.5)` | `rgb(0 0 0 / 0.7)` |
| Panel background | `--ds-color-surface-overlay` = `#ffffff` | `#2f3f56` |
| Panel shadow | `--ds-shadow-xl` | `--ds-shadow-xl` |
| Panel border | none | `1px solid --ds-color-border` (`#334155`) |
| Header text | `--ds-color-text` | `#f1f5f9` |
| Body text | `--ds-color-text-subtle` | `#94a3b8` |
| Close button | `--ds-color-text-subtle` | `#94a3b8` |
| Close hover bg | `--ds-color-neutral-100` | `#334155` |
| Footer divider | `--ds-color-border` | `#334155` |

---

### Navigation / Tabs (`ds-tabs`, `ds-nav`)

| Property | Light | Dark |
|----------|-------|------|
| Tab background (default) | transparent | transparent |
| Tab text | `--ds-color-text-subtle` | `#94a3b8` |
| Tab text (active) | `--ds-color-primary` | `#3b82f6` |
| Tab indicator / underline | `--ds-color-primary` 2 px | `#3b82f6` 2 px |
| Tab hover bg | `--ds-color-neutral-100` | `#273548` |
| Nav background | `--ds-color-surface` | `#1e293b` |
| Nav border bottom | `--ds-color-border` | `#334155` |
| Nav item text | `--ds-color-text` | `#f1f5f9` |
| Nav item active bg | `--ds-color-primary-subtle` | `#1e3a5f` |
| Nav item active text | `--ds-color-primary` | `#3b82f6` |

---

### Table (`ds-table`)

| Property | Light | Dark |
|----------|-------|------|
| Header background | `--ds-color-neutral-50` = `#f8fafc` | `#273548` |
| Header text | `--ds-color-text-subtle` | `#94a3b8` |
| Row background | `--ds-color-surface` = `#ffffff` | `#1e293b` |
| Row alt (striped) | `--ds-color-neutral-50` = `#f8fafc` | `#273548` |
| Row hover | `--ds-color-primary-subtle` = `#eff6ff` | `#1e3a5f` |
| Row selected | `--ds-color-primary-subtle` | `#1e3a5f` |
| Cell text | `--ds-color-text` | `#f1f5f9` |
| Border | `--ds-color-border` | `#334155` |

---

### Tooltip (`ds-tooltip`)

| Property | Light | Dark |
|----------|-------|------|
| Background | `--ds-color-neutral-900` = `#0f172a` | `--ds-color-neutral-100` = `#f1f5f9` |
| Text | `--ds-color-neutral-50` = `#f8fafc` | `--ds-color-neutral-900` = `#0f172a` |
| Shadow | `--ds-shadow-md` | `--ds-shadow-md` |
| Arrow | same as background | same as background |
| Max-width | `240px` | `240px` |

Like toasts, tooltips use a reversed surface to make them pop against the page.

---

### Progress / Skeleton / Spinner (`ds-progress`, `ds-skeleton`, `ds-spinner`)

| Component | Light track | Light fill | Dark track | Dark fill |
|-----------|-------------|-----------|-----------|----------|
| Progress bar | `--ds-color-neutral-200` | `--ds-color-primary` | `#334155` | `#3b82f6` |
| Skeleton | `--ds-color-neutral-200` | animated shimmer `#e2e8f0→#f1f5f9` | `#273548` | shimmer `#334155→#3d4f68` |
| Spinner | — | `--ds-color-primary` | — | `#3b82f6` |

---

### Theming Implementation Pattern (per component)

Every component follows the same three-layer CSS pattern. No component needs its own `@media` query:

```css
/* Layer 1 — component-scoped token declarations (with semantic fallbacks) */
:host {
  --ds-button-bg:           var(--ds-color-primary);
  --ds-button-bg-hover:     var(--ds-color-primary-hover);
  --ds-button-color:        var(--ds-color-primary-foreground);
  --ds-button-border:       transparent;
  --ds-button-shadow:       var(--ds-shadow-xs);
  --ds-button-radius:       var(--ds-radius-md);
}

/* Layer 2 — consume the component tokens */
.root {
  background-color: var(--ds-button-bg);
  color:            var(--ds-button-color);
  border:           1px solid var(--ds-button-border);
  box-shadow:       var(--ds-button-shadow);
  border-radius:    var(--ds-button-radius);
}

/* Layer 3 — host application can override any component token */
/* (no code needed here — that's the consuming app's responsibility) */
```

`global.css` overrides the semantic tokens (`--ds-color-primary`, etc.) for dark mode. Layer 1 fallbacks resolve to the new dark-mode semantic values automatically. Zero dark-mode CSS inside any component file.

---

## Accessibility

### Requirements (non-negotiable)

| Requirement | Standard |
|-------------|----------|
| Color contrast — text | WCAG 2.2 AA ≥ 4.5 : 1 (normal), ≥ 3 : 1 (large) |
| Color contrast — UI components | WCAG 2.2 AA ≥ 3 : 1 |
| Keyboard operability | All interactive components fully navigable via Tab, Space, Enter, Arrow keys |
| Focus visible | Always visible — never hidden |
| Touch target size | Minimum 44 × 44 px (WCAG 2.5.5) |
| Reduced motion | All animations respect `prefers-reduced-motion: reduce` |
| Screen reader labels | Every control has an accessible name (visible label or `aria-label`) |
| Error identification | Errors must be described in text, never color alone |

### ARIA Patterns

- Use native HTML semantics inside Shadow DOM wherever possible (`<button>`, `<input>`, `<label>`).
- Apply `role` attributes only when a native element is unavailable.
- Components with expand/collapse behavior must use `aria-expanded`.
- Components that load async content must use `aria-live` regions.
- Components that modify page content must use `aria-controls` pointing to the controlled region.
- Never use `aria-label` to override visible text — use `aria-describedby` to supplement it.

---

## CSS Token Reference

The following block is the authoritative token list. `packages/core/src/global/global.css` must match this specification. When adding new tokens, add them here first, then implement.

```css
/* ─────────────────────────────────────────
   Brand / Interactive
───────────────────────────────────────── */
--ds-color-primary: #2563eb;
--ds-color-primary-hover: #1d4ed8;
--ds-color-primary-active: #1e40af;
--ds-color-primary-subtle: #eff6ff;
--ds-color-primary-foreground: #ffffff;

/* ─────────────────────────────────────────
   Semantic States
───────────────────────────────────────── */
--ds-color-success: #16a34a;
--ds-color-success-subtle: #f0fdf4;
--ds-color-success-foreground: #ffffff;

--ds-color-warning: #d97706;
--ds-color-warning-subtle: #fffbeb;
--ds-color-warning-foreground: #ffffff;

--ds-color-danger: #dc2626;
--ds-color-danger-subtle: #fef2f2;
--ds-color-danger-foreground: #ffffff;

--ds-color-info: #0891b2;
--ds-color-info-subtle: #ecfeff;
--ds-color-info-foreground: #ffffff;

/* ─────────────────────────────────────────
   Neutrals
───────────────────────────────────────── */
--ds-color-neutral-50: #f8fafc;
--ds-color-neutral-100: #f1f5f9;
--ds-color-neutral-200: #e2e8f0;
--ds-color-neutral-300: #cbd5e1;
--ds-color-neutral-400: #94a3b8;
--ds-color-neutral-500: #64748b;
--ds-color-neutral-600: #475569;
--ds-color-neutral-700: #334155;
--ds-color-neutral-800: #1e293b;
--ds-color-neutral-900: #0f172a;

/* ─────────────────────────────────────────
   Surfaces & Text
───────────────────────────────────────── */
--ds-color-surface: #ffffff;
--ds-color-surface-raised: #ffffff;
--ds-color-surface-overlay: #ffffff;
--ds-color-border: #e2e8f0;
--ds-color-border-strong: #94a3b8;
--ds-color-text: #0f172a;
--ds-color-text-subtle: #64748b;
--ds-color-text-disabled: #94a3b8;
--ds-color-text-inverse: #ffffff;

/* ─────────────────────────────────────────
   Typography
───────────────────────────────────────── */
--ds-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--ds-font-family-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

--ds-font-size-xs: 0.75rem;
--ds-font-size-sm: 0.875rem;
--ds-font-size-md: 1rem;
--ds-font-size-lg: 1.125rem;
--ds-font-size-xl: 1.25rem;
--ds-font-size-2xl: 1.5rem;
--ds-font-size-3xl: 1.875rem;
--ds-font-size-4xl: 2.25rem;

--ds-font-weight-regular: 400;
--ds-font-weight-medium: 500;
--ds-font-weight-semibold: 600;
--ds-font-weight-bold: 700;

--ds-line-height-tight: 1.25;
--ds-line-height-snug: 1.375;
--ds-line-height-normal: 1.5;
--ds-line-height-relaxed: 1.625;

--ds-letter-spacing-tight: -0.025em;
--ds-letter-spacing-normal: 0em;
--ds-letter-spacing-wide: 0.025em;
--ds-letter-spacing-wider: 0.05em;

/* ─────────────────────────────────────────
   Spacing
───────────────────────────────────────── */
--ds-space-0: 0;
--ds-space-1: 0.25rem;
--ds-space-2: 0.5rem;
--ds-space-3: 0.75rem;
--ds-space-4: 1rem;
--ds-space-5: 1.25rem;
--ds-space-6: 1.5rem;
--ds-space-8: 2rem;
--ds-space-10: 2.5rem;
--ds-space-12: 3rem;
--ds-space-16: 4rem;
--ds-space-20: 5rem;
--ds-space-24: 6rem;

/* Legacy spacing aliases — do not use in new components */
--ds-spacing-xs: var(--ds-space-1);
--ds-spacing-sm: var(--ds-space-2);
--ds-spacing-md: var(--ds-space-4);
--ds-spacing-lg: var(--ds-space-6);
--ds-spacing-xl: var(--ds-space-8);

/* ─────────────────────────────────────────
   Border Radius
───────────────────────────────────────── */
--ds-radius-none: 0;
--ds-radius-sm: 0.25rem;
--ds-radius-md: 0.375rem;
--ds-radius-lg: 0.5rem;
--ds-radius-xl: 0.75rem;
--ds-radius-2xl: 1rem;
--ds-radius-full: 9999px;

/* Legacy radius aliases */
--ds-border-radius-sm: var(--ds-radius-sm);
--ds-border-radius-md: var(--ds-radius-md);
--ds-border-radius-lg: var(--ds-radius-lg);

/* ─────────────────────────────────────────
   Elevation / Shadows
───────────────────────────────────────── */
--ds-shadow-none: none;
--ds-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--ds-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10);
--ds-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10);
--ds-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);
--ds-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);
--ds-shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

/* ─────────────────────────────────────────
   Motion
───────────────────────────────────────── */
--ds-duration-instant: 50ms;
--ds-duration-fast: 100ms;
--ds-duration-normal: 150ms;
--ds-duration-moderate: 200ms;
--ds-duration-slow: 300ms;
--ds-duration-slower: 500ms;

--ds-ease-linear: linear;
--ds-ease-in: cubic-bezier(0.4, 0, 1, 1);
--ds-ease-out: cubic-bezier(0, 0, 0.2, 1);
--ds-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ds-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Legacy motion aliases */
--ds-transition-speed: var(--ds-duration-normal);
--ds-transition-easing: var(--ds-ease-in-out);
```

---

## global.css Maintenance Rules

1. **global.css is the single source** for all `:root` token declarations. Never declare `--ds-*` tokens inside a component file — only consume them.
2. **Adding a token**: add it to this document first (under CSS Token Reference), then add it to `global.css`.
3. **Renaming a token**: keep the old name as an alias (`--old-name: var(--new-name);`) for one minor version, then remove in the next major version.
4. **Dark mode values** live in `global.css` under `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]` — not in component files.
5. **Do not add non-token rules** (selectors, resets, base styles) to `global.css`. It is a token sheet only. Any base reset belongs in a separate `reset.css`.
