# Loop Budget — Shared Termination Contract

Every self-correction loop in every pipeline skill is bounded by this contract, so an unattended run
can never spin forever. When a cap is breached, the skill **escalates and rolls back** instead of
retrying. Skills link here rather than restating the numbers.

See `docs/plan/01-git-isolation-and-termination.md` for the full design.

---

## The caps

| Cap | Limit | Scope |
|-----|-------|-------|
| **Per-error** | ≤ 3 attempts on the **same** error | Consecutive fixes for one error key |
| **Global** | ≤ 10 total fix attempts | Per skill invocation, regardless of error variety |
| **Subjective / visual stage** | ≤ 5 cycles | Any loop with a non-mechanical gate (e.g. manual visual review) |

A single skill invocation stops as soon as **any** cap is hit.

## "Same error" is defined by a key, not by eye

Two failures are "the same error" iff they produce the same **error key**. The key is the first
non-empty `stderr` line, normalized (line/column numbers and absolute paths stripped), as computed by:

```bash
node scripts/loop/same-error.mjs   # reads command output on stdin → prints the stable key
```

Use the key — not the raw message — to count per-error attempts. A shifting message with the same key
still counts against the ≤ 3 per-error cap; that is the whole point (a mutating error must not defeat
the bound).

---

## Escalation-on-breach procedure

When a cap is breached, do **all** of the following, in order, then stop:

1. **Capture the last output.** Append the full last command output to the run log:
   `node scripts/loop/log.mjs <stage> escalate --reason "<cap> exceeded" --errorKey "<key>"`
2. **Log the blocking error** to the issue tracker via **stencil-issue-tracker** POST-ERROR
   (`references/known-issues.md`) — a new entry, or increment recurrence if it already exists.
3. **Roll back** the stage's changes:
   ```bash
   bash scripts/loop/rollback.sh <mode> <tag>
   ```
   - `create` mode → restores/cleans the component dir.
   - `bugfix` mode → reverts the attempted fix but **keeps** the repro test (a kept-but-failing repro
     test is a useful artifact for the next run, not corruption).
4. **Write a structured-handoff** (WRITE mode) with status `blocked`, recording the hypothesis and the
   last failure so the next session resumes with context.
5. **Stop** with a single clear message naming the cap, the stage, and the error key. Never leave
   partial state on the branch tip.

---

## Quick reference for a skill's self-correction loop

- Count attempts by error key (`same-error.mjs`), not by raw string.
- Break on green. Otherwise re-run, incrementing the counter.
- On **3rd** failure of one error key **or** the **10th** total attempt **or** the **5th** subjective
  cycle → run the escalation-on-breach procedure above. Do **not** attempt a 4th same-error fix.
