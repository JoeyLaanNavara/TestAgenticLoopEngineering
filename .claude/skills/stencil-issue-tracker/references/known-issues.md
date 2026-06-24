# Known Issues — StencilJS Component Pipeline

Living document. Updated automatically by the `stencil-issue-tracker` skill.
Entries with **Recurrences ≥ 2** are Watch Items and checked on every pre-flight.

---

## Watch Items

> These are checked automatically before every build/test/storybook run.

_No watch items yet. Issues are promoted here after recurring 2+ times._

---

## Documented Issues

---

### ISSUE-001: Corepack crashes with `URL.canParse is not a function`

**Symptom:** `pnpm exec <any>` exits with `TypeError: URL.canParse is not a function` inside `corepack.cjs`.
**Skill / Phase:** storybook-component / PHASE 3; stencil-bootstrap / PHASE 3
**Root Cause:** The `packageManager` field in `package.json` causes corepack to intercept `pnpm`. `URL.canParse` was added in Node 19.9; corepack ≥ 0.24 requires it. Node 16/17/18 do not have it.
**Fix:**
```bash
# Install Node 20 LTS and switch to it
nvm install 20
nvm use 20
node --version  # must be >= 20.x
```
**Preventive Check:** `node --version` — must be ≥ 18; recommend ≥ 20. A `.nvmrc` file in the workspace root pins the version: `cat .nvmrc` should output `20`.
**Recurrences:** 1
**Last seen:** storybook-component / storybook build

---

### ISSUE-002: Storybook build fails — `Cannot find module 'lit'`

**Symptom:** Vite's `import-analysis` plugin throws `Failed to resolve import "lit"` when building stories that use `html` from `lit`.
**Skill / Phase:** storybook-component / PHASE 3
**Root Cause:** `@storybook/web-components` relies on `lit` for the `html` template tag used in story render functions. `lit` is a peer dependency that must be explicitly installed in `apps/storybook/package.json`.
**Fix:**
```bash
# Add lit to apps/storybook/package.json devDependencies
pnpm --filter @my-org/storybook add -D lit
pnpm install --no-frozen-lockfile
```
**Preventive Check:** `grep '"lit"' apps/storybook/package.json` — should return a version line.
**Recurrences:** 1
**Last seen:** storybook-component / storybook build

<!-- Template for new entries:

---

### ISSUE-[id]: [Short Title]

**Symptom:** [What error message or behavior triggers this?]
**Skill / Phase:** [e.g., stencil-component-build / PHASE 3]
**Root Cause:** [Why does this happen?]
**Fix:**
```[language]
[exact commands or code changes]
```
**Preventive Check:** [How to verify this before running? Used if promoted to watch item.]
**Recurrences:** 1
**Last seen:** [skill] / [component-name]

-->
