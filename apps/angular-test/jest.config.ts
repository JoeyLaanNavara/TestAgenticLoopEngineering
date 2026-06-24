import type { Config } from 'jest';

const config: Config = {
  displayName: 'angular-test',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    // @my-org/core is type-only in the Angular proxies; this stub prevents Jest from
    // processing Stencil source (which requires its own JSX factory).
    '^@my-org/core$': '<rootDir>/src/__mocks__/my-org-core-mock.ts',
    '^@my-org/angular$': '<rootDir>/../../packages/angular/src/index.ts',
  },
};

export default config;
