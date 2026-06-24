# Framework Integration Testing — Reference Patterns

## Architecture overview

```
apps/angular-test/   — Jest + jest-preset-angular + @angular/core/testing
apps/react-test/     — Vitest + @testing-library/react + happy-dom
apps/vue-test/       — Vitest + @vue/test-utils + happy-dom
```

All three test the **proxy/wrapper layer only**. The web component JavaScript never
executes in these environments — `ds-button` appears as an unknown HTMLElement with
JS properties set on it by the wrapper.

---

## Test app scaffold templates

Use these when a test app is missing. Run `pnpm install` after creating each.

### `apps/angular-test/package.json`
```json
{
  "name": "@my-org/angular-test",
  "version": "0.0.1",
  "private": true,
  "scripts": { "test": "jest --passWithNoTests", "test:watch": "jest --watch" },
  "dependencies": {
    "@my-org/angular": "workspace:^",
    "@angular/common": "^17.3.0",
    "@angular/core": "^17.3.0",
    "@angular/platform-browser": "^17.3.0",
    "@angular/platform-browser-dynamic": "^17.3.0",
    "rxjs": "^7.8.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-preset-angular": "^14.1.0",
    "typescript": "^5.4.0"
  }
}
```

### `apps/angular-test/jest.config.ts`
```typescript
import type { Config } from 'jest';
const config: Config = {
  displayName: 'angular-test',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': ['jest-preset-angular', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@my-org/core$': '<rootDir>/src/__mocks__/my-org-core-mock.ts',
    '^@my-org/angular$': '<rootDir>/../../packages/angular/src/index.ts',
  },
};
export default config;
```

### `apps/angular-test/setup-jest.ts`
```typescript
import 'jest-preset-angular/setup-jest';
```

### `apps/angular-test/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "module": "CommonJS",
    "strict": false
  },
  "include": ["src", "setup-jest.ts", "jest.config.ts"]
}
```

### `apps/angular-test/tsconfig.spec.json`
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": ["jest", "node"], "esModuleInterop": true },
  "include": ["src/**/*.spec.ts", "setup-jest.ts"]
}
```

### `apps/angular-test/src/__mocks__/my-org-core-mock.ts`
```typescript
export namespace Components {}
export namespace JSX { export interface IntrinsicElements {} }
```

---

### `apps/react-test/package.json`
```json
{
  "name": "@my-org/react-test",
  "version": "0.0.1",
  "private": true,
  "scripts": { "test": "vitest run", "test:watch": "vitest" },
  "dependencies": {
    "@my-org/react": "workspace:^",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite-tsconfig-paths": "^5.0.0",
    "vitest": "^2.0.0",
    "happy-dom": "^15.0.0",
    "typescript": "^5.4.0"
  }
}
```

### `apps/react-test/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  plugins: [react(), tsconfigPaths({ root: '../../' })],
  test: { environment: 'happy-dom', globals: true, setupFiles: ['./src/setup.ts'] },
});
```

### `apps/react-test/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx", "jsxImportSource": "react",
    "module": "ESNext", "moduleResolution": "bundler",
    "strict": false
  },
  "include": ["src", "vitest.config.ts"]
}
```

### `apps/react-test/src/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

---

### `apps/vue-test/package.json`
```json
{
  "name": "@my-org/vue-test",
  "version": "0.0.1",
  "private": true,
  "scripts": { "test": "vitest run", "test:watch": "vitest" },
  "dependencies": { "@my-org/vue": "workspace:^", "vue": "^3.4.0" },
  "devDependencies": {
    "@vue/test-utils": "^2.4.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vite-tsconfig-paths": "^5.0.0",
    "vitest": "^2.0.0",
    "happy-dom": "^15.0.0",
    "typescript": "^5.4.0"
  }
}
```

### `apps/vue-test/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  plugins: [
    vue({ template: { compilerOptions: { isCustomElement: (t) => t.startsWith('ds-') } } }),
    tsconfigPaths({ root: '../../' }),
  ],
  test: { environment: 'happy-dom', globals: true, setupFiles: ['./src/setup.ts'] },
});
```

### `apps/vue-test/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "module": "ESNext", "moduleResolution": "bundler", "strict": false },
  "include": ["src", "vitest.config.ts"]
}
```

---

## NX project.json template (same shape for all three)

```json
{
  "name": "[angular-test | react-test | vue-test]",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/[name]/src",
  "projectType": "application",
  "targets": {
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm exec [jest | vitest run] --passWithNoTests",
        "cwd": "{projectRoot}"
      }
    }
  },
  "tags": ["scope:[angular|react|vue]", "type:integration-test"]
}
```

---

## Known edge cases

### Angular: `el.propName` returns `undefined` after `detectChanges()`
The `@ProxyCmp` decorator installs getters/setters **only** after the `DsButton` class
is declared. If your test imports `DsButton` and Angular DI creates the component, the
prototype setters should be in place. Ensure:
1. `DsButton` is in `declarations: [DsButton]` in `TestBed.configureTestingModule`.
2. `fixture.detectChanges()` is called before asserting element properties.

### Angular: `proxyOutputs is not a function`
`utils.ts` in `packages/angular/src/directives/angular-component-lib/` uses `fromEvent`
from `rxjs`. Make sure `rxjs` is in `dependencies` of `apps/angular-test/package.json`.

### React: `onDsClick` not called
The React wrapper maps `onDsClick` → `el.addEventListener('dsClick', ...)` via `attachProps`.
Ensure you dispatch `new CustomEvent('dsClick')` (camelCase, no hyphen). Dispatching
`CustomEvent('ds-click')` won't match.

### Vue: `wrapper.find('ds-button').element.label` is `undefined`
Vue's `h()` passes string element props as attributes by default for non-object values.
For custom elements, Vue should set JS properties. Add `await wrapper.vm.$nextTick()`
before asserting. If still failing, check that `defineContainer` received the prop name
in its `componentProps` array (see `packages/vue/src/components/stencil-generated/index.ts`).

### Vue: `@dsClick` in a template doesn't fire
Vue converts `onDsClick` to a DOM listener for `ds-click` (hyphenated), but Stencil fires
`dsClick` (camelCase). Use a `ref` + `addEventListener('dsClick', ...)` in `mounted()`
for reliable event tests — see the `Host` component pattern in SKILL.md.

### `@my-org/core` module resolution errors (Angular Jest)
The Angular proxy has `import { Components } from '@my-org/core'` used only in a
`declare interface` (type erased at compile time). If Jest still tries to load the module,
the `moduleNameMapper` in `jest.config.ts` points to `src/__mocks__/my-org-core-mock.ts`
as a lightweight stub. If that stub causes type errors, expand it to export empty objects
for any symbols the proxy references.

---

## Checklist when adding a new component

1. Rebuild core to regenerate proxies: `nx run core:build:dev`
2. Add `[ComponentName].spec.ts` in `apps/angular-test/src/tests/`
3. Add `[ComponentName].spec.tsx` in `apps/react-test/src/tests/`
4. Add `[ComponentName].spec.ts` in `apps/vue-test/src/tests/`
5. Run `nx test angular-test react-test vue-test` — all green before moving on
