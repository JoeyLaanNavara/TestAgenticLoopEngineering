---
name: stencil-issue-tracker
description: >
  Compound skill that maintains a living knowledge base of StencilJS component issues and their verified fixes.
  Load this skill BEFORE starting any component work to pre-apply known fixes, and AFTER resolving any build,
  test, or Storybook error to document it. When an issue recurs 2+ times it is promoted to a "watch item"
  and proactively checked on every run. Works across all pipeline phases: bootstrap, build, test, Storybook, MCP.
---

# StencilJS Issue Tracker

A compound skill that spans the entire component pipeline. Its job is to **remember what broke and how it was fixed**, so the same error is never solved twice from scratch.

## Two Modes

| Mode | When to load | What to do |
|------|-------------|-----------|
| **Pre-flight** | Before starting any skill (bootstrap / build / test / storybook) | Read `references/known-issues.md`, apply all "watch item" preventive fixes |
| **Post-error** | After any self-correction loop resolves an error | Document the issue + fix, increment recurrence count if it already exists |

---

## Pre-flight: Check Known Issues

```
Load: references/known-issues.md
```

1. Scan the **Watch Items** section — these are recurring issues that must be checked proactively.
2. For each watch item, verify the preventive step is already in place before the main skill runs.
3. If a preventive step is missing, apply it now (before the build/test/storybook step).
4. Log which watch items were checked and their status.

**Example output:**
```
🔍 Pre-flight check (stencil-issue-tracker)
   ✅ WATCH-001: host element CSS display — :host { display } present in all components
   ✅ WATCH-003: barrel export — all components listed in src/index.ts
   ⚠️  WATCH-007: storybook lit import — missing in new-button.stories.ts → added automatically
```

---

## Post-error: Document a New or Recurring Issue

When a self-correction loop in any skill resolves an error, call this skill to record it.

### Step 1 — Check if the issue already exists

Search `references/known-issues.md` for:
- The exact error message (or a key substring)
- The symptom pattern (e.g., "build fails after adding new component")

### Step 2a — If the issue EXISTS: increment recurrence

```markdown
<!-- In known-issues.md, find the matching entry and update: -->
- **Recurrences:** 2 → 3
- **Last seen:** stencil-component-build / [component-name] / [date]
```

If recurrences reaches **2**, promote the issue to the **Watch Items** section so it gets checked pre-flight on every run.

### Step 2b — If the issue is NEW: add an entry

Append a new entry to the **Documented Issues** section of `references/known-issues.md` using this template:

```markdown
---

### ISSUE-[next-id]: [Short Title]

**Symptom:** What error message or behavior triggers this?
**Skill / Phase:** Which skill and phase does this occur in? (e.g., stencil-testing / PHASE 1)
**Root Cause:** Why does this happen?
**Fix:**
\`\`\`[language]
[exact commands or code changes that resolve it]
\`\`\`
**Preventive Check:** How to verify this won't happen before running? (used for watch items)
**Recurrences:** 1
**Last seen:** [skill] / [component-name]
```

### Step 3 — Confirm write

After updating the file, confirm:
```
📝 stencil-issue-tracker updated
   Issue: ISSUE-[id] — [title]
   Action: [new entry | recurrence incremented to N | promoted to watch item]
```

---

## Watch Item Promotion Criteria

An issue is promoted to a Watch Item when:
- Recurrences ≥ 2, **OR**
- It causes a hard build failure (not just a warning), **OR**
- It silently produces incorrect output (tests pass but behaviour is wrong)

Watch items live in the **Watch Items** section of `known-issues.md` and are checked on every pre-flight.

---

## Integration with Other Skills

This skill does not replace the self-correction loops in other skills. It wraps them:

```
stencil-bootstrap       → pre-flight: check watch items
                        → [bootstrap runs]
                        → post-error (if any): document issue

stencil-component-build → pre-flight: check watch items
                        → [build runs]
                        → post-error (if any): document issue

stencil-testing         → pre-flight: check watch items
                        → [tests run + self-correct]
                        → post-error (if any): document issue

storybook-component     → pre-flight: check watch items
                        → [storybook build runs + self-correct]
                        → post-error (if any): document issue
```

The other skills do NOT need to be modified — this skill is loaded alongside them and handles the knowledge layer.

---

## Definition of Success

- [ ] Pre-flight check runs and all watch items are verified before the main skill executes
- [ ] Any watch item preventive fix that is missing is applied automatically
- [ ] Every error resolved by a self-correction loop results in a new or updated entry in `known-issues.md`
- [ ] Issues with ≥ 2 recurrences are in the Watch Items section
- [ ] The `known-issues.md` file is committed / saved after every update
- [ ] The same error is never solved from scratch twice — it is caught pre-flight on the next run
