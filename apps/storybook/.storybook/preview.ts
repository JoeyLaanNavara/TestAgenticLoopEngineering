import type { Preview } from '@storybook/web-components';

// Import the core web components
import '@my-org/core/loader';
import { defineCustomElements } from '@my-org/core/loader';
defineCustomElements();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
