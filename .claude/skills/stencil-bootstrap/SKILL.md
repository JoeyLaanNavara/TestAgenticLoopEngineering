---
name: stencil-bootstrap
description: Bootstrap and verify a StencilJS component library project with all major framework output targets (Angular, React, Vue). Use this skill whenever starting a new StencilJS project, checking if a StencilJS project is correctly configured, setting up framework output targets, or when an agent needs to verify the project foundation before building components. Always trigger this before any StencilJS component work if project setup hasn't been confirmed yet.
---

# StencilJS Bootstrap & Project Verification

Ensure the StencilJS project exists and is correctly configured with all framework output targets before any component work begins.

**All commands run from the workspace root** (`/path/to/TestAgenticLoopEngineering`) unless noted.

---

## PHASE 1: Verify Project Exists

```bash
ls packages/core/stencil.config.ts 2>/dev/null || ls packages/core/stencil.config.js 2>/dev/null
```

**If config does NOT exist** — initialize inside `packages/core/`:
```bash
cd packages/core && pnpm create stencil@latest component .
```

---

## PHASE 2: Verify Framework Output Targets

Read `packages/core/stencil.config.ts` and check for Angular, React, and Vue output targets.

Install any missing packages (from workspace root):
```bash
pnpm --filter @my-org/core add -D \
  @stencil/angular-output-target \
  @stencil/react-output-target \
  @stencil/vue-output-target
```

The `packages/core/stencil.config.ts` MUST contain all of the following output targets. If any are missing, add them:

```typescript
import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

export const config: Config = {
  namespace: 'my-org',
  globalStyle: 'src/global/global.css',
  outputTargets: [
    // Core outputs
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null,
    },

    // Angular
    angularOutputTarget({
      componentCorePackage: '@my-org/core',
      outputType: 'component',
      directivesProxyFile: '../angular/src/directives/proxies.ts',
      directivesArrayFile: '../angular/src/directives/index.ts',
    }),

    // React
    reactOutputTarget({
      componentCorePackage: '@my-org/core',
      proxiesFile: '../react/src/components/stencil-generated/index.ts',
    }),

    // Vue
    vueOutputTarget({
      componentCorePackage: '@my-org/core',
      proxiesFile: '../vue/src/components/stencil-generated/index.ts',
    }),
  ],
};
```

---

## PHASE 3: Verify Build Passes

Run a dev build to confirm the project compiles cleanly:
```bash
nx run core:build:dev 2>&1
```

**Self-correction loop — run until exit 0:**
1. Run the command and capture full stdout + stderr
2. Check exit code — if 0 **and** no `error` / `ERR` lines in output → break ✅
3. Read the **complete** error output (never guess from a truncated snippet)
4. Identify root cause and apply the fix:
   - TypeScript errors → fix the offending file
   - Missing output-target package → `pnpm --filter @my-org/core add -D <package>`
   - Config syntax error → fix `stencil.config.ts`
   - Node version too old → verify `node --version` ≥ 18; switch with `nvm use` if needed
5. Re-run `nx run core:build:dev 2>&1` from step 1
6. After 3 failed attempts on the **same** error: search `stencil-issue-tracker/references/known-issues.md` for a match; document as a new issue if not found

Do not proceed to Phase 4 until this loop exits successfully.

---

## PHASE 4: Extract Project Conventions

Read 2–3 existing components in `packages/core/src/components/` (if any) and capture:

- **Tag prefix** — e.g. `ds-` in `<ds-button>`
- **Naming convention** — kebab-case filenames, PascalCase class names
- **Prop patterns** — `@Prop()`, `@Event()`, `@Method()` usage
- **CSS variable patterns** — how theming is done
- **Test conventions** — file names, helper usage
- **Story conventions** — Meta shape, story export names, story file location (`apps/storybook/stories/`)

If no components exist yet, default to StencilJS best practices:
- Tag prefix = `ds-` (design system)
- Shadow DOM = `true`
- CSS vars prefixed with `--ds-`

**Output a brief summary of discovered conventions** so downstream skills can use them without re-reading files.

---

## Bootstrap Complete

Report:
```
✅ StencilJS project verified  (packages/core/stencil.config.ts)
✅ Framework targets: Angular | React | Vue | Web Components
✅ Dev build: passing  (nx run core:build:dev)
✅ Conventions captured: [prefix], [naming], [css-var-pattern]
```

---

## Definition of Success

- [ ] `packages/core/stencil.config.ts` (or `.js`) exists and is valid
- [ ] All three framework output targets are present in the config: Angular, React, and Vue
- [ ] `nx run core:build:dev` exits with no errors
- [ ] Tag prefix, naming convention, CSS variable pattern, and test/story conventions are captured and returned to the calling agent
- [ ] No component work begins until this skill reports all four checks above as passing
