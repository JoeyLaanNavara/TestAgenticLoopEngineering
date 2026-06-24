# /build-component

Build a production-ready StencilJS component end-to-end: source → tests → Storybook → framework bindings → MCP registration.

This command orchestrates five skills in sequence. Each skill must succeed before the next begins.

## Usage
```
/build-component <ComponentName> [optional description]
```

## Examples
```
/build-component Button "A flexible button with variants and sizes"
/build-component DatePicker "A date picker with range selection support"
/build-component Modal "An accessible modal dialog with slots for header and body"
```

---

## PIPELINE OVERVIEW

```
stencil-bootstrap
  └─ Verify project + framework targets + conventions
        ↓
stencil-component-build
  └─ Create .tsx + .scss + index.ts, dev build must pass
        ↓
stencil-testing
  └─ Unit tests + e2e tests, all must be green
        ↓
storybook-component
  └─ .stories.ts + Storybook build must pass
        ↓
[stencil build]
  └─ Full build generates Angular / React / Vue proxies
        ↓
component-library-mcp
  └─ Bootstrap MCP server if needed, verify discoverability
```

**Do NOT skip steps. Do NOT proceed past a failing step.**

---

## STEP 1 — Bootstrap

Read and follow: `stencil-bootstrap`

Captures and outputs:
- Tag prefix (e.g. `my`)
- Naming conventions
- CSS variable patterns
- Existing library conventions

---

## STEP 2 — Build Component

Read and follow: `stencil-component-build`

Pass in:
- Component name from `$ARGUMENTS`
- Conventions from Step 1

Outputs:
- `src/components/[name]/[name].tsx`
- `src/components/[name]/[name].scss`
- `src/components/[name]/index.ts`
- Confirmed passing dev build

---

## STEP 3 — Tests

Read and follow: `stencil-testing`

Pass in:
- Component name + tag prefix
- The `.tsx` source from Step 2

Outputs:
- `src/components/[name]/[name].spec.tsx` — all passing ✅
- `src/components/[name]/[name].e2e.ts` — all passing ✅

**Self-corrects until green. Does not proceed until green.**

---

## STEP 4 — Storybook

Read and follow: `storybook-component`

Pass in:
- Component name + tag prefix
- All `@Prop` names, types, defaults
- All `@Event` names

Outputs:
- `src/components/[name]/[name].stories.ts`
- Confirmed passing Storybook build ✅

**Self-corrects until Storybook builds. Does not proceed until green.**

---

## STEP 5 — Framework Bindings

Run the full StencilJS production build to generate all framework proxies:

```bash
npx stencil build 2>&1
```

Verify the new component appears in each framework output:

```bash
PASCAL=$(echo "$ARGUMENTS" | sed 's/-\([a-z]\)/\U\1/g; s/^\([a-z]\)/\U\1/')

grep -l "$PASCAL" ../component-library-angular/src/directives/proxies.ts \
  && echo "✅ Angular" || echo "❌ Angular — missing"

grep -l "$PASCAL" ../component-library-react/src/components/stencil-generated/index.ts \
  && echo "✅ React" || echo "❌ React — missing"

grep -l "$PASCAL" ../component-library-vue/src/components/stencil-generated/index.ts \
  && echo "✅ Vue" || echo "❌ Vue — missing"
```

If any framework output is missing, re-check the `stencil.config.ts` output targets and re-run the build.

---

## STEP 6 — MCP Server

Read and follow: `component-library-mcp`

Outputs:
- MCP server running (bootstrapped or verified existing)
- `.claude/settings.json` updated
- New component confirmed discoverable via `list_components`

---

## FINAL REPORT

```
╔══════════════════════════════════════════════╗
║  ✅ Component Build Complete: [ComponentName] ║
╠══════════════════════════════════════════════╣
║ Source Files:                                ║
║   ✅ [name].tsx                              ║
║   ✅ [name].scss                             ║
║   ✅ index.ts                                ║
║                                              ║
║ Tests:                                       ║
║   ✅ Unit:  X/X passing                      ║
║   ✅ E2E:   X/X passing                      ║
║                                              ║
║ Documentation:                               ║
║   ✅ Storybook: X stories                    ║
║   ✅ readme.md auto-generated                ║
║                                              ║
║ Framework Outputs:                           ║
║   ✅ Angular proxy                           ║
║   ✅ React proxy                             ║
║   ✅ Vue proxy                               ║
║   ✅ Web Component (vanilla)                 ║
║                                              ║
║ MCP Server:                                  ║
║   ✅ [created / verified] — component live   ║
╚══════════════════════════════════════════════╝
```
