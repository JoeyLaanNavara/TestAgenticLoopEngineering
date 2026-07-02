# /build-component — DEPRECATED

> **This command is superseded by [`/auto-component`](auto-component.md).**

`/build-component` is no longer maintained. Use the autonomous loop driver instead:

```
/auto-component create <Name> "<spec>"
```

`/auto-component` owns the full state machine (bootstrap → build → test → design-lint → storybook →
wrappers → framework-integration → mcp), advances only on green gates, runs every stage under the
Loop Budget, and writes a structured handoff on exit. It also adds a **bugfix** mode:

```
/auto-component bugfix <component> "<bug report>"
```

## Why this command was retired

It carried stale references that no longer match the project:

- **Testing** — the single `stencil-testing` skill was split into **`stencil-unit-test`** (spec via
  `newSpecPage`) and **`stencil-e2e-test`** (Playwright). Run them as separate gated stages.
- **Styles** — component styles are **`.css`**, not `.scss`.
- **Layout** — framework wrappers live in **`packages/angular`**, **`packages/react`**, and
  **`packages/vue`** — not sibling `../component-library-*` directories.

See [`auto-component.md`](auto-component.md) for the current pipeline.
