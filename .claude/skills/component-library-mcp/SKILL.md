---
name: component-library-mcp
description: Bootstrap or update a dynamic MCP server for a StencilJS component library that exposes tools for listing components, querying props, retrieving stories, and getting framework-specific usage. Use this skill whenever an agent needs to create an MCP server for a component library, register a new component in the MCP server, verify component discoverability via MCP, or update the .claude/settings.json to connect the MCP server. Always trigger after storybook-component has completed. The MCP server reads components dynamically from disk so no code changes are needed when new components are added.
---

# Component Library MCP Server

Bootstrap a dynamic MCP server for the component library, or verify a new component is discoverable in an existing one.

---

## PHASE 1: Check if MCP Server Exists

```bash
ls mcp-server/package.json 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"
```

→ If `EXISTS`: skip to **PHASE 3**
→ If `NOT_FOUND`: continue to **PHASE 2**

---

## PHASE 2: Bootstrap the MCP Server

Create a dynamic MCP server that reads from `src/components/` at query time — no restarts or code changes needed when new components are added.

### File structure:
```
mcp-server/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### `mcp-server/package.json`
```json
{
  "name": "component-library-mcp",
  "version": "1.0.0",
  "type": "module",
  "description": "MCP server exposing the component library as queryable tools",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "glob": "^10.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### `mcp-server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### `mcp-server/src/index.ts`

```typescript
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
      component: z.string().describe('Component name in kebab-case, e.g. "my-button"'),
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
          styles: read(`${component}.scss`),
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
    const file = path.join(COMPONENTS_DIR, component, `${component}.stories.ts`);
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
            `<!-- Via CDN -->`,
            `<script type="module" src="your-library/dist/your-library.esm.js"></script>`,
            ``,
            `<!-- Usage -->`,
            `<[prefix]-${component}></ [prefix]-${component}>`,
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
    const pascal = component.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
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
    const read = (file: string) => {
      const p = path.join(base, file);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          unitTests: read(`${component}.spec.tsx`),
          e2eTests: read(`${component}.e2e.ts`),
        }, null, 2),
      }],
    };
  }
);

// ── Start ─────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Install and build:
```bash
cd mcp-server
pnpm install
pnpm run build 2>&1
cd ..
```

**Self-correction loop — run until exit 0:**
1. Run `pnpm run build 2>&1` (inside `mcp-server/`) and capture full output
2. Check exit code — if 0 **and** no `error TS` lines → break ✅
3. Read the **complete** TypeScript error output
4. Identify root cause and fix:
   - `error TS2305: Module has no exported member` → check `@modelcontextprotocol/sdk` import paths; consult the SDK's published types
   - `error TS7016: Could not find declaration file` → add `"skipLibCheck": true` to `tsconfig.json`
   - `error TS2307: Cannot find module 'glob'` → run `pnpm install` inside `mcp-server/`
   - Module resolution error → verify `"moduleResolution": "NodeNext"` and `"module": "NodeNext"` in `tsconfig.json`
5. Re-run `pnpm run build 2>&1` from step 1
6. **Loop Budget** (see [`../_shared/loop-budget.md`](../_shared/loop-budget.md)): two failures are the *same error* only if `node scripts/loop/same-error.mjs` returns the same key. Retry a given error at most **3×**; stop after **10** total fix attempts in this skill. On every resolved error you **must** log it via `stencil-issue-tracker` POST-ERROR (append if new, increment recurrence if known) — not optional. If the budget is exceeded, escalate: log the blocker, write a `blocked` structured-handoff, and stop.

Do NOT proceed to Phase 3 until the MCP server builds successfully.

### Register in `.claude/settings.json`:
```json
{
  "mcpServers": {
    "component-library": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"]
    }
  }
}
```

If `.claude/settings.json` already exists, merge the `mcpServers` key — don't overwrite existing entries.

---

## PHASE 3: Verify Component is Discoverable

The MCP server reads from disk dynamically. Run a quick smoke test:

```bash
node --input-type=module << 'EOF'
import { glob } from 'glob';
import path from 'path';

const COMPONENTS_DIR = path.resolve('packages/core/src/components');
const entries = await glob('*/index.ts', { cwd: COMPONENTS_DIR });
const components = entries.map(e => path.dirname(e));

const target = process.argv[2] || '[component-name]';
const found = components.includes(target);

console.log('All components:', components.join(', '));
console.log(found ? `✅ "${target}" is discoverable` : `❌ "${target}" NOT found`);
process.exit(found ? 0 : 1);
EOF
```

If the component is not found, verify:
1. The component directory exists at `src/components/[name]/`
2. An `index.ts` file exists inside it
3. The name matches exactly (kebab-case)

---

## Complete

```
✅ MCP server: [created / already existed]
✅ Tools: list_components | get_component | get_stories | get_framework_usage | get_component_tests
✅ Registered in .claude/settings.json
✅ [component-name] is discoverable via MCP
```

See `references/mcp-tools-reference.md` for the full tool API reference.

---

## Definition of Success

- [ ] `mcp-server/package.json` exists and `pnpm run build` inside `mcp-server/` exits with no errors
- [ ] All five tools are registered: `list_components`, `get_component`, `get_stories`, `get_framework_usage`, `get_component_tests`
- [ ] The MCP server entry is present in `.claude/settings.json` under `mcpServers` without overwriting other entries
- [ ] The smoke test confirms the new component is discoverable (`index.ts` found under `src/components/[name]/`)
- [ ] The MCP server reads components dynamically — no code change is needed when future components are added
