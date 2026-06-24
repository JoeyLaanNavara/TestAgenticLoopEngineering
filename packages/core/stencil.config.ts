import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

export const config: Config = {
  namespace: 'my-org',
  globalStyle: 'src/global/global.css',
  outputTargets: [
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
    angularOutputTarget({
      componentCorePackage: '@my-org/core',
      outputType: 'component',
      directivesProxyFile: '../angular/src/directives/proxies.ts',
      directivesArrayFile: '../angular/src/directives/index.ts',
    }),
    reactOutputTarget({
      componentCorePackage: '@my-org/core',
      proxiesFile: '../react/src/components/stencil-generated/index.ts',
    }),
    vueOutputTarget({
      componentCorePackage: '@my-org/core',
      proxiesFile: '../vue/src/components/stencil-generated/index.ts',
    }),
  ],
  testing: {
    browserHeadless: 'new',
  },
};
