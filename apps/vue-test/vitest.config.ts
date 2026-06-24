import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      // Tell Vue not to warn about ds-* custom elements in test host templates.
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('ds-'),
        },
      },
    }),
    // Resolves @my-org/* paths from tsconfig.base.json at the workspace root.
    tsconfigPaths({ root: '../../' }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setup.ts'],
  },
});
