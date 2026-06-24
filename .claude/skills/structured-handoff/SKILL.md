---
name: structured-handoff
description: >
  Capture and restore structured work context so agents stay coherent across sessions — not just
  minutes. WRITE mode (invoke at the end of any pipeline skill): records the five mandatory fields —
  what was implemented, what was left undone, commands run with exit codes, issues discovered, and
  whether procedures were followed. Saves a timestamped handoff file and updates HANDOFF_INDEX.md.
  READ mode (invoke as the first step of any new session, before stencil-bootstrap): loads the most
  recent handoff for the current task and surfaces a concise context summary. Cross-references
  stencil-issue-tracker for issue IDs. Use this skill to maintain continuity across any multi-day or
  multi-session component pipeline.
---

# Structured Handoffs

How agents stay coherent over days, not just minutes. Every worker reports five things at the end of every skill; every new session restores them at the start.

```
New Task → Execute → Observe → Learn → Encode → (next New Task)
  READ            [skill runs]           WRITE
```

---

## Two Modes

| Mode | When to invoke | What it does |
|------|---------------|--------------|
| **WRITE** | End of any pipeline skill (before reporting success) | Collects the five fields, writes a dated file, updates the index |
| **READ** | Start of any new session, before stencil-bootstrap | Loads the last relevant handoff, surfaces context for the incoming agent |

---

## WRITE Mode — Capture a Handoff

Invoke at the **end of every skill**, after the skill's Definition of Success has been evaluated.

### Step 1 — Collect the Five Fields

Fill every field. If a field has nothing to report, write `None` — never leave it blank.

---

**Field 1: What Was Implemented**

List every file created or modified with a one-line description of its end state:

```
packages/core/src/components/ds-button/ds-button.tsx  — created; shadow DOM, 3 @Props, 2 @Events
packages/core/src/components/ds-button/ds-button.css  — created; 4 CSS custom properties
packages/core/src/index.ts                             — updated; ds-button barrel export added
```

---

**Field 2: What Was Left Undone**

Checkboxes. Include the reason each item was skipped or deferred:

```
- [ ] E2E tests — stencil-e2e-test not run yet (next step)
- [ ] Storybook story — storybook-component not run yet (next step)
- [ ] Accessibility audit — out of scope for this task
```

If nothing was left undone, write `None — all Definition of Success items met`.

---

**Field 3: Commands Run + Exit Codes**

Every shell command executed, in order, with its exit code and a short note:

```
npx stencil build --dev            exit 0   clean build
npm run test -- --spec ds-button   exit 0   4/4 passing
```

If a command was retried after a self-correction, list both attempts:

```
npx stencil build --dev            exit 1   missing @stencil/core import (run 1)
npx stencil build --dev            exit 0   import added, clean (run 2)
```

---

**Field 4: Issues Discovered**

Any error encountered, even if self-corrected inline. Cross-reference stencil-issue-tracker IDs when the issue was logged there:

```
- Build failed: missing @stencil/core import → fixed inline → logged as ISSUE-004
- CSS var naming mismatch (--ds-btn- vs --ds-button-) → corrected inline; not logged (first occurrence)
```

If no issues were encountered, write `None`.

---

**Field 5: Procedure Checklist**

Copy the **Definition of Success** checklist from the skill that ran. Mark each item `[x]` (done) or `[ ]` (not done). For any `[ ]`, state why:

```
- [x] ds-button.tsx, ds-button.css, index.ts all created
- [x] shadow: true in @Component decorator
- [x] JSDoc on every @Prop and @Event
- [x] CSS custom properties with global token fallbacks
- [x] npx stencil build --dev exits 0
- [ ] Barrel export added to src/index.ts — MISSING; file not found in this package
```

---

### Step 2 — Set Status

Choose exactly one:

| Status | Criteria |
|--------|----------|
| `complete` | Every Definition of Success item is `[x]`; no blockers |
| `partial` | Some items `[x]`, some `[ ]`; clear next steps exist |
| `blocked` | Cannot proceed to the next skill; specific blocker identified |

---

### Step 3 — Write Recommended Next Steps

Based on what was left undone and the status, list 1–3 concrete next actions in priority order:

```
1. Run stencil-unit-test for ds-button (unit tests not written)
2. Add barrel export to src/index.ts (missing — see Field 5)
3. Run storybook-component for ds-button
```

---

### Step 4 — Determine the Next Sequence Number

Read `references/HANDOFF_INDEX.md`. Take the highest existing ID and add 1. If the file is empty or has no rows, start at `001`.

---

### Step 5 — Write the Handoff File

**Path**: `references/handoffs/<NNN>-<YYYY-MM-DD>-<skill-name>-<component>.md`

Example: `references/handoffs/003-2026-06-24-stencil-component-build-ds-button.md`

Use `N-A` as the component segment when no specific component applies.

```markdown
---
id: <NNN>
skill: <skill-name>
component: <ds-component-name or "N/A">
date: <YYYY-MM-DD>
status: <complete | partial | blocked>
---

## Implemented
<Field 1 content>

## Left Undone
<Field 2 content>

## Commands Run
| Command | Exit Code | Notes |
|---------|-----------|-------|
<one row per command>

## Issues Discovered
<Field 4 content>

## Procedure Checklist
<Field 5 content>

## Recommended Next Steps
<numbered list>
```

---

### Step 6 — Update the Index

Append one row to `references/HANDOFF_INDEX.md`:

```
| <NNN> | <YYYY-MM-DD> | <skill> | <component> | <status> | [view](handoffs/<filename>) |
```

---

### Step 7 — Confirm

Output this block before the skill's own completion message:

```
📋 Handoff written
   ID:       <NNN>
   Skill:    <skill> | Component: <component>
   Status:   <complete | partial | blocked>
   File:     references/handoffs/<filename>
   Undone:   <N> items
   Next:     <first recommended step>
```

---

## READ Mode — Restore Prior Context

Invoke at the **start of any new session**, before stencil-bootstrap or any pipeline skill runs.

### Step 1 — Open the Index

Read `references/HANDOFF_INDEX.md`.

If the file does not exist or has no data rows:
```
ℹ️  No prior handoff found — starting fresh session
```
Continue without prior context.

---

### Step 2 — Find the Most Relevant Entry

Scan the index rows in descending ID order. Match using the first rule that applies:

1. **Exact match**: `skill` AND `component` both match the current task
2. **Skill match**: `skill` matches; any component
3. **Any recent**: pick the highest-ID row regardless of skill

Use the best match. If multiple rows tie, use the highest ID (most recent).

---

### Step 3 — Load and Summarize

Read the matched handoff file. Output:

```
🔄 Prior session context restored
   From:   <skill> / <component> on <date>   [<status>]

   ✅ Already done:
      <bullet list from Implemented>

   ⚠️  Still needed:
      <bullet list from Left Undone>

   🚧 Issues to watch:
      <Issues Discovered — or "None">

   📌 Recommended first step: <first item from Recommended Next Steps>
```

---

### Step 4 — Surface Blockers Immediately

If the prior status was `blocked`, prepend this warning **before any other output**:

```
🛑 BLOCKED from prior session
   Skill:   <skill>
   Blocker: <specific blocker from Recommended Next Steps>
   Action:  Resolve this before running any other skill.
```

---

## Integration with Other Skills

This skill wraps the pipeline. No existing skill files need to be modified — the calling agent invokes READ at session start and WRITE after each skill completes.

```
[Session start]
  structured-handoff READ  →  restore prior context
  stencil-bootstrap        →  verify project + capture conventions

stencil-component-build    →  [build phases]
  structured-handoff WRITE →  capture handoff (partial or complete)

stencil-unit-test          →  [test phases]
  structured-handoff WRITE →  capture handoff

stencil-e2e-test           →  [test phases]
  structured-handoff WRITE →  capture handoff

storybook-component        →  [story phases]
  structured-handoff WRITE →  capture handoff

framework-integration-testing → [integration phases]
  structured-handoff WRITE →  capture handoff
```

**Relationship to stencil-issue-tracker:**

| Skill | What it tracks |
|-------|---------------|
| `stencil-issue-tracker` | Error knowledge base — recurring errors and their fixes |
| `structured-handoff` | Session state — work progress and continuity |

Handoff Field 4 (Issues Discovered) references `ISSUE-NNN` IDs from `stencil-issue-tracker/references/known-issues.md`. The two skills are complementary: an error that recurs in multiple sessions gets logged in stencil-issue-tracker AND cross-referenced in each session's handoff.

---

## Definition of Success

**WRITE mode:**
- [ ] All five fields are populated — no field is blank or missing
- [ ] Status (`complete`, `partial`, `blocked`) accurately reflects the wrapped skill's Definition of Success
- [ ] Handoff file is written to `references/handoffs/` with the correct naming convention (`NNN-YYYY-MM-DD-skill-component.md`)
- [ ] `references/HANDOFF_INDEX.md` has a new row for this handoff
- [ ] Any issues cross-referenced use valid `ISSUE-NNN` IDs from stencil-issue-tracker
- [ ] The confirmation block is output before the session ends

**READ mode:**
- [ ] `references/HANDOFF_INDEX.md` is read before any pipeline skill runs
- [ ] The most relevant prior handoff is identified and loaded (or fresh-start is explicitly confirmed)
- [ ] A context summary is output before stencil-bootstrap or any other skill begins
- [ ] Any `blocked` status from a prior session is surfaced as a `🛑` warning before other output
