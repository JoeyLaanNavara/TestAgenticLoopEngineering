import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    // Resolves @my-org/* paths from tsconfig.base.json at the workspace root.
    tsconfigPaths({ root: '../../' }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setup.ts'],
  },
});
