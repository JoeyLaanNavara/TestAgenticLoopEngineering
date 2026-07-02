# /auto-component

Autonomous loop driver for the StencilJS component library. One entry point that owns the state
machine and advances stages without a human driving each step — for both **create** and **bugfix** modes.

This command is the deterministic spec of the loop; the agent executes it turn-to-turn. It supersedes
`/build-component`.

## Usage
```
/auto-component create <Name> "<spec>"
/auto-component bugfix <component> "<bug report>"
```

## Examples
```
/auto-component create Badge "small status label with primary/success/danger variants and sm|md|lg sizes"
/auto-component create DatePicker "date picker with range selection"
/auto-component bugfix ds-card "ignores the elevated prop — shadow never applied"
/auto-component bugfix ds-button "disabled button still emits dsClick on click"
```

---

## STATE MACHINE

```
SessionStart hook → structured-handoff READ + issue-tracker Watch Items         (plan 02)
        ↓
create isolation branch  auto/<mode>-<component>-<shortdate>   e.g. auto/create-ds-badge-0701   (plan 01)
        ↓
stencil-bootstrap ──(gate: 4 checks pass)──┐
        ↓                                   │  EVERY stage:
  ┌─ mode = create ─────────────────────────┤   - runs under the Loop Budget           (_shared/loop-budget.md, plan 01)
  │   stencil-component-build               │   - logs errors to stencil-issue-tracker (plan 02)
  │   → stencil-unit-test                    │   - appends events to the run log via scripts/loop/log.mjs (plan 06)
  │   → stencil-e2e-test                     │   - MUST clear its gate before the next stage
  │   → design-lint gate  (plan 03)          │   - on Loop Budget breach → rollback + blocked handoff (plan 01)
  │   → storybook-component                  │
  │   → stencil build (wrappers)             │
  │   → framework-integration-testing        │
  │   → component-library-mcp                 │
  │                                           │
  └─ mode = bugfix ──────────────────────────┤
      stencil-bugfix  Phases 1–5  (plan 04)   │
        ↓                                     │
      framework-integration-testing  (only if the public API changed)
        ↓
Stop hook → forced structured-handoff WRITE   (plan 02)
```

Parse `$ARGUMENTS`: first token = mode (`create` | `bugfix`), second = component/Name, remainder
(quoted) = spec or bug report.

---

## PRELUDE (both modes)

The **SessionStart** hook (`scripts/loop/session-context.mjs`) already injected prior context: last
handoff + issue-tracker Watch Items. Honor it — if a prior handoff was `blocked`, resolve that blocker
first. Then create the isolation branch so nothing ever mutates `main`:

```bash
SHORTDATE=$(date +%m%d)
git checkout -b "auto/<mode>-<component>-${SHORTDATE}"
```

All edits, builds, and generated wrappers happen on this branch only. (Stronger isolation via a git
worktree is optional — see plan 01.)

Then run **stencil-bootstrap** and gate on its 4 checks. Capture the tag prefix, naming, and CSS var
conventions for downstream stages. Do not advance until bootstrap is green.

---

## PER-STAGE RESPONSIBILITIES (the driver owns these)

For **every** stage below, the driver:

1. **Runs the stage** (invoke the named skill) and reads its machine-checkable success signal.
2. **Enforces the gate** — advance only on green. A failing gate halts advancement; it is never skipped.
3. **Applies the Loop Budget** — self-correction is capped per `.claude/skills/_shared/loop-budget.md`
   (≤3 per error key, ≤10 global, ≤5 subjective). Count error keys with `scripts/loop/same-error.mjs`.
4. **Logs to the issue-tracker** — any self-corrected error is recorded via stencil-issue-tracker
   POST-ERROR (mandatory).
5. **Appends to the run log** — `node scripts/loop/log.mjs <stage> <event> …` for
   `stage-start | attempt | gate | issue-logged | escalate | rollback | complete`
   (writes `.claude/loop-logs/<branch>.jsonl`).
6. **Rolls back on breach** — on any Loop Budget cap breach:
   `node scripts/loop/log.mjs <stage> escalate …` → stencil-issue-tracker POST-ERROR →
   `bash scripts/loop/rollback.sh <mode> <component>` → **structured-handoff WRITE, status `blocked`** →
   stop with a clear message. Do not continue the pipeline past an escalation.

---

## CREATE MODE — stage sequence

Each stage must clear its gate before the next begins.

| # | Stage (skill) | Gate (machine-checkable) |
|---|---------------|--------------------------|
| 1 | `stencil-component-build` | `nx build core` (dev) exits 0, no error/ERR; files created |
| 2 | `stencil-unit-test` | `cd packages/core && npx stencil test --spec <name>` → 0 failing |
| 3 | `stencil-e2e-test` | `cd packages/core && npx stencil test --e2e <name>` → 0 failing |
| 4 | **design-lint gate** | `node scripts/design-lint.mjs <name>` → `{ "pass": true }` (plan 03) |
| 5 | `storybook-component` | `nx run storybook:build-storybook` succeeds |
| 6 | **stencil build (wrappers)** | `nx build core` → Angular/React/Vue proxies present (see below) |
| 7 | `framework-integration-testing` | `nx test angular-test` + `nx test react-test` + `nx test vue-test` green |
| 8 | `component-library-mcp` | new component discoverable via `list_components` |

**Stage 6 — verify wrapper proxies (packages/ layout, not sibling dirs):**

```bash
PASCAL=$(echo "<name>" | sed 's/^ds-//; s/-\([a-z]\)/\U\1/g; s/^\([a-z]\)/\U\1/')
grep -q "$PASCAL" packages/angular/src/directives/proxies.ts                       && echo "✅ Angular" || echo "❌ Angular"
grep -q "$PASCAL" packages/react/src/components/stencil-generated/index.ts         && echo "✅ React"   || echo "❌ React"
grep -q "$PASCAL" packages/vue/src/components/stencil-generated/index.ts           && echo "✅ Vue"     || echo "❌ Vue"
```

If any proxy is missing, re-check `stencil.config.ts` output targets and re-run `nx build core`.

---

## BUGFIX MODE — branch

Dispatch straight into **stencil-bugfix** (plan 04) and drive its five phases as the gate stack:

| Phase | Gate |
|-------|------|
| 1 — Reproduce | New failing test fails **for the reported reason**. Not reproducible → escalate (no repro → stop). |
| 2 — Localize | Hypothesis (file + lines + why) via component-library MCP (`get_component`, `get_component_tests`) + grep |
| 3 — Fix | Minimal edit under the Loop Budget |
| 4 — Verify | **Both:** repro test green **and** full `--spec` + `--e2e` suites green; `design-lint <name>` still `pass: true` |
| 5 — Guard | Keep the repro test; log root cause via issue-tracker POST-ERROR; note API impact |

Then, **only if the public API changed** (a `@Prop`, `@Event`, `@Method`, or slot), run
**framework-integration-testing** to re-verify the Angular/React/Vue wrappers. If the fix was internal
(no API change), skip it.

---

## COMMANDS (project conventions)

- Build core + regenerate wrappers: `nx build core` (or `cd packages/core && npx stencil build`)
- Dev build: `cd packages/core && npx stencil build --dev`
- Unit (spec) tests: `cd packages/core && npx stencil test --spec`
- E2E tests: `cd packages/core && npx stencil test --e2e`
- Storybook build: `nx run storybook:build-storybook`
- Design lint: `node scripts/design-lint.mjs <name>`
- Framework wrappers live in `packages/angular`, `packages/react`, `packages/vue` (NOT sibling
  `../component-library-*` dirs). Component CSS is **`.css`**, never `.scss`. Tags are `ds-` kebab-case;
  class names PascalCase; events `dsCamelCase`.

---

## EPILOGUE (both modes)

Write a **structured-handoff** (WRITE mode) — the Stop hook (`scripts/loop/check-handoff.mjs`) will
block stopping until one exists for this session. Then emit the run summary and the status box.

Run log lives at `.claude/loop-logs/<branch>.jsonl` (+ human summary `.md`); the handoff's Command and
Issue fields can be derived from it (plan 06).

### FINAL REPORT

```
╔══════════════════════════════════════════════════════╗
║  ✅ /auto-component <mode> — <component>               ║
╠══════════════════════════════════════════════════════╣
║ Branch:   auto/<mode>-<component>-<shortdate>          ║
║ Mode:     create | bugfix                              ║
║                                                        ║
║ Stages (create):                                       ║
║   ✅ bootstrap        ✅ component-build                ║
║   ✅ unit-test X/X    ✅ e2e-test X/X                   ║
║   ✅ design-lint      ✅ storybook                      ║
║   ✅ wrappers (Ng/React/Vue)                           ║
║   ✅ framework-integration  ✅ mcp discoverable         ║
║                                                        ║
║ Stages (bugfix):                                       ║
║   ✅ repro red→green   ✅ full suite X/X (no regress)   ║
║   ✅ design-lint       ✅ root cause logged             ║
║   ▫ framework-integration (only if API changed)        ║
║                                                        ║
║ Loop Budget:  attempts used <N>/10                     ║
║ Run log:      .claude/loop-logs/<branch>.jsonl         ║
║ Handoff:      structured-handoff #<NNN> [status]       ║
╚══════════════════════════════════════════════════════╝
```

For a **blocked** run, replace ✅ with 🛑 on the failing stage and name the error key, the breached
cap, and the rollback action taken.
