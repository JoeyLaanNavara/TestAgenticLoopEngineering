import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = path.resolve(__dirname, '../../packages/core/src/components');

const server = new McpServer({
  name: 'component-library',
  version: '1.0.0',
});

// ── Tool: list_components ─────────────────────────────────────────────────
server.registerTool(
  'list_components',
  {
    description: 'List all components available in the library',
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async () => {
    const entries = await glob('*/index.ts', { cwd: COMPONENTS_DIR });
    const components = entries.map(e => path.dirname(e)).sort();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ count: components.length, components }, null, 2),
      }],
    };
  }
);

// ── Tool: get_component ───────────────────────────────────────────────────
server.registerTool(
  'get_component',
  {
    description: 'Get the TypeScript source, styles, and auto-generated docs for a component',
    inputSchema: {
      component: z.string().describe('Component name in kebab-case, e.g. "ds-button"'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ component }) => {
    const base = path.join(COMPONENTS_DIR, component);
    if (!fs.existsSync(base)) {
      return {
        content: [{ type: 'text', text: `Component "${component}" not found. Call list_components to see available components.` }],
        isError: true,
      };
    }

    const read = (file: string) => {
      const p = path.join(base, file);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          component,
          source: read(`${component}.tsx`),
          styles: read(`${component}.css`),
          docs: read('readme.md'),
        }, null, 2),
      }],
    };
  }
);

// ── Tool: get_stories ─────────────────────────────────────────────────────
server.registerTool(
  'get_stories',
  {
    description: 'Get the Storybook stories for a component — shows all variants, props, and usage examples',
    inputSchema: {
      component: z.string().describe('Component name in kebab-case'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ component }) => {
    const storiesDir = path.resolve(__dirname, '../../../apps/storybook/stories');
    const file = path.join(storiesDir, `${component}.stories.ts`);
    if (!fs.existsSync(file)) {
      return {
        content: [{ type: 'text', text: `No stories found for "${component}". Stories may not have been created yet.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: fs.readFileSync(file, 'utf-8') }],
    };
  }
);

// ── Tool: get_framework_usage ─────────────────────────────────────────────
server.registerTool(
  'get_framework_usage',
  {
    description: 'Get the generated proxy/wrapper code for using a component in Angular, React, Vue, or vanilla HTML',
    inputSchema: {
      component: z.string().describe('Component name in kebab-case'),
      framework: z.enum(['angular', 'react', 'vue', 'vanilla']).describe('Target framework'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ component, framework }) => {
    if (framework === 'vanilla') {
      return {
        content: [{
          type: 'text',
          text: [
            `<!-- Load via CDN or bundler -->`,
            `<script type="module" src="@my-org/core/dist/my-org.esm.js"></script>`,
            ``,
            `<!-- Usage -->`,
            `<${component}></${component}>`,
          ].join('\n'),
        }],
      };
    }

    const proxyPaths: Record<string, string> = {
      angular: '../../packages/angular/src/directives/proxies.ts',
      react: '../../packages/react/src/components/stencil-generated/index.ts',
      vue: '../../packages/vue/src/components/stencil-generated/index.ts',
    };

    const proxyFile = path.resolve(__dirname, proxyPaths[framework]);
    if (!fs.existsSync(proxyFile)) {
      return {
        content: [{
          type: 'text',
          text: `Framework output for "${framework}" not found at ${proxyFile}. Run: nx build core`,
        }],
        isError: true,
      };
    }

    const content = fs.readFileSync(proxyFile, 'utf-8');
    const pascal = component.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join('');
    const lines = content.split('\n');
    const start = lines.findIndex(l => l.includes(pascal));

    if (start === -1) {
      return {
        content: [{
          type: 'text',
          text: `"${pascal}" not found in ${framework} proxy file. Run: nx build core`,
        }],
        isError: true,
      };
    }

    const snippet = lines.slice(Math.max(0, start - 2), start + 25).join('\n');
    return { content: [{ type: 'text', text: snippet }] };
  }
);

// ── Tool: get_component_tests ─────────────────────────────────────────────
server.registerTool(
  'get_component_tests',
  {
    description: 'Get the unit test and e2e test files for a component',
    inputSchema: {
      component: z.string().describe('Component name in kebab-case'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ component }) => {
    const base = path.join(COMPONENTS_DIR, component);
    const e2eDir = path.resolve(__dirname, '../../packages/core/e2e');

    const read = (file: string) => {
      const p = path.join(base, file);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
    };

    const readE2e = (file: string) => {
      const p = path.join(e2eDir, file);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          unitTests: read(`${component}.spec.tsx`),
          e2eTests: readE2e(`${component}.e2e.ts`),
        }, null, 2),
      }],
    };
  }
);

// ── Start ─────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
