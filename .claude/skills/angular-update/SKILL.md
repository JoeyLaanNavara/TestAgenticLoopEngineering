---
name: upgrade-angular
description: Incrementally upgrade an Angular project across one or more major versions using a self-validating, self-correcting agentic loop. Use this skill whenever the user wants to upgrade, bump, or migrate Angular to a newer version — a single step or all the way to the latest — mentions `ng update`, references a version jump like "15 to 21", or asks to modernize an Angular app, even if they don't explicitly say "skill". Delegates each version step to a dedicated subagent, enforces validation gates (version bumped + lint + build + unit tests + e2e tests, judged as no regressions from a pre-upgrade baseline), retries its own fixes a bounded number of times (default 3), rolls back and escalates to the user on unrecoverable failure, and commits each verified step separately.
---

# Upgrade Angular

Upgrade an Angular project one major version at a time, from its current version to a target version. Each version step is delegated to a dedicated subagent so context stays clean and version-specific breaking changes don't bleed across steps. Every step must prove it worked (version bumped, lint green, build green) before it is committed. A step that fails self-corrects up to a bounded number of attempts, then rolls back and hands the user a clear report instead of pushing broken code forward.

## Why this design

- **Single-version subagents** prevent hallucination and context confusion across multiple version jumps — each subagent only ever reasons about one transition.
- **Validation gates** make "it upgraded" objectively checkable instead of assumed.
- **Bounded retries** let the agent fix ordinary upgrade breakage on its own, without looping forever or silently degrading the checks to force a pass.
- **Rollback + escalation** means a project is never left in a half-broken state, and the human is told exactly what happened.

## Loop & retry configuration

These are the defaults that govern the self-checking behaviour. Treat them as overridable if the user asks.

| Setting | Default | Meaning |
|---|---|---|
| `MAX_FIX_ATTEMPTS` | `3` | Max consecutive failed fix attempts allowed **on the same problem** (same error signature) before escalating. Resets when that problem is resolved. Progress on other problems does NOT consume this budget. |
| `MAX_TOTAL_CYCLES` | `10` | Absolute ceiling on revalidation cycles per version step. A backstop against oscillating fixes that never converge (fix A reintroduces B, etc.), which per-problem counting alone can't catch. |
| `VALIDATION_GATES` | `version, lint, build, unit tests, e2e tests` | Checks that must ALL pass (no regressions) for a step to count as successful |
| `RUN_UNIT_TESTS` | `true` | Run the unit-test gate every cycle. If no unit suite exists it is N/A (skipped), not failed. |
| `E2E_GATE` | `per-step` | WHEN the e2e gate runs (e2e is expensive, so its cadence is tunable): `off` = never; `each-cycle` = every revalidation cycle, alongside the other gates (most thorough, slowest); `per-step` = once per version step, only after version+lint+build+unit pass, then e2e failures re-enter the fix loop (balanced default); `final-only` = skipped during version steps, run once after the last step succeeds (cheapest, but a failure won't pinpoint which version caused it). An absent e2e suite is N/A. |
| `HALT_ON_FAILURE` | `true` | If a step exhausts its attempts, stop the whole run (don't continue to the next version) |
| `ROLLBACK_ON_FAILURE` | `true` | Reset the working tree to the last good commit when a step fails permanently |
| `REQUIRE_GREEN_BASELINE` | `true` | Refuse to start if the project doesn't build cleanly before any upgrade |

## Run documentation & problem tracking

Every run persists its state and problems to disk — this is what lets the loop count the per-problem budget across cycles and lets a human see what happened, even after a rollback. Write artifacts under a per-run directory:

```
docs/angular-upgrade/<run-id>/          # run-id = UTC timestamp YYYYMMDD-HHMMSS
├── run.md                              # whole-run summary + index of steps
└── steps/
    ├── <from>-to-<to>.md               # human-readable step report
    └── <from>-to-<to>.problems.json    # machine registry, rewritten each cycle
```

Each distinct problem gets a stable ID `<FROM>-<TO>-<NNN>` (e.g. `15-16-001`) bound to its error signature, so re-encountering the same problem reuses its ID and attempt count. Read `references/run-artifacts.md` for the full folder/naming convention, the `problems.json` schema, and the report templates — consult it before writing any artifacts. The commit-vs-rollback rule (keep artifacts untracked during a step; commit on success; they survive `git reset --hard` on failure) is defined there.

Alongside the per-run artifacts, a single run-independent **known-problems ledger** at `docs/angular-upgrade/known-problems.json` accumulates cross-run learning: which fixes have worked for a given problem class and which approaches have failed. Subagents consult it before attempting a fix and update it on every outcome, so repeated runs reuse good fixes and avoid repeating dead ends. Read `references/known-problems.md` for its schema and usage.

## Orchestration workflow

Follow these phases in order.

### 1. Detect and plan
- Read the current `@angular/core` version from `package.json`.
- Ask the user (or infer from their request) the target version. Default target is the latest stable Angular.
- Compute the incremental path, one major at a time (e.g. `15 → 16 → 17 → 18 → 19 → 20 → 21`). Never skip a major version — each transition has its own documented breaking changes.
- Show the user the detected version and the planned path, and confirm before proceeding.
- Establish the run: create `docs/angular-upgrade/<run-id>/` (run-id = UTC `YYYYMMDD-HHMMSS`) and write `run.md` with the planned path and config (see `references/run-artifacts.md`).
- Look up each step's official update guide URL in `references/version-matrix.md`.

### 2. Pre-flight baseline check (runs once, before any upgrade)
A project that is already broken makes later failures impossible to attribute. Before any version step:
1. **Clean tree** — `git status --porcelain` is empty. If not, stop and ask the user to commit or stash.
2. **Dependencies install** — run the detected package manager's install; confirm success.
3. **Green build** — run the project's build. If it fails, do NOT proceed; report the baseline failure. A red baseline means the project isn't upgrade-ready.
4. **Test baseline** — run the unit suite non-interactively and record which tests pass (see `references/test-gates.md`). Also run the e2e suite unless `E2E_GATE` is `off`; when `E2E_GATE` is `final-only`, this pre-flight e2e result is the reference baseline for the end-of-run e2e check. Unlike the build, do NOT refuse to start on pre-existing red or flaky tests — record them and surface them to the user; later gates only care about *regressions* from baseline. An absent suite is N/A.
5. **Version confirmed** — confirm the current version was read correctly.

If `REQUIRE_GREEN_BASELINE` is true and any check fails, halt and notify the user before touching anything.

### 3. Per-version execution
For each step in the path, delegate to a dedicated Angular Specialist subagent using the task template below. The subagent owns its own self-validation loop and returns a definitive `SUCCESS` or `FAILED_AFTER_RETRIES`.

- On `SUCCESS`: move to the next version.
- On `FAILED_AFTER_RETRIES`: if `HALT_ON_FAILURE` is true, stop the run. Do not attempt later versions. Surface the failure report (below) to the user.

### 4. Finish
- After the last step succeeds, summarize the versions upgraded and the commits created.
- If `E2E_GATE` is `final-only`: run the full e2e suite headless once now, comparing against the pre-flight e2e baseline. If it regresses, escalate with a failure report — but note that the responsible version can't be pinpointed from this run alone (that's the tradeoff of `final-only`; re-run with `per-step` to localize it). If it passes, amend/commit the confirmation into the final state.
- For `each-cycle`/`per-step`, each committed version already passed e2e with no regressions from its baseline. Note any tests that were pre-existing failures or flaky at baseline (out of scope), so the user knows what wasn't covered.
- Mention that optional code migrations (`references/migrations.md`) can be applied now, after all version upgrades are complete.

## Subagent task template (one per version step)

Delegate each step with instructions like this, filling in the bracketed values:

```
Upgrade Angular from [CURRENT] to [NEXT] ONLY. Do not upgrade beyond [NEXT].

Update guide: [VERSION_UPDATE_GUIDE_URL]
Max fix attempts for this step: [MAX_FIX_ATTEMPTS] (default 3)

1. Discover project structure
   - Find package.json and angular.json (may be nested, monorepo, etc.).
   - Detect the package manager (npm, yarn, pnpm) and the build working directory.
   - SELF-CHECK: if package.json or angular.json can't be found, report
     FAILED_AFTER_RETRIES immediately (reason: "project structure not found").
     Do not guess paths.

2. Prepare
   - Verify git status is clean. If dirty, STOP and report.
   - Run the package manager install to refresh dependencies.
   - Record BASELINE_VERSION = current @angular/core version.
   - Record LAST_GOOD_COMMIT = current git HEAD (for rollback).
   - Record BASELINE_TESTS = the set of unit tests (and e2e tests, if `E2E_GATE` is
     `each-cycle` or `per-step`) that PASS right now, run non-interactively (see
     references/test-gates.md). The tree is at the last known-good state here, so this
     is the reference; later, only tests that regress from BASELINE_TESTS count as
     failures. (For `final-only`, the pre-flight e2e baseline is used instead.)
   - Load the known-problems ledger docs/angular-upgrade/known-problems.json if it
     exists (see references/known-problems.md) — this is prior cross-run learning
     about what fixes have and haven't worked for this kind of upgrade.

3. Execute the upgrade (run ONCE)
   - Run: ng update @angular/cli@[NEXT] @angular/core@[NEXT]
   - Update all related @angular/* packages to [NEXT].
   - Update TypeScript if the [CURRENT]→[NEXT] guide requires it.
   - Accept breaking-change migrations if prompted.
   - Do NOT re-run ng update inside the retry loop — it runs exactly one time.

4. Self-validation & fix loop (PER-PROBLEM budget, not per-cycle)
   The retry budget is spent per distinct problem, keyed by an ERROR SIGNATURE:
   normalize each error to `error_code + file + message`, stripping line/column
   numbers and variable-specific text so the "same" logical error matches across
   re-runs. Group errors sharing one root cause — e.g. one changed API surfacing
   in many files — as ONE problem.

   State:
     stalls = {}          # signature -> consecutive failed fix attempts on it
     total_cycles = 0
     prev_failing = {}    # signatures that failed last cycle
     grew_streak = 0      # consecutive cycles where the failure count increased
   Registry file: docs/angular-upgrade/<run-id>/steps/[CURRENT]-to-[NEXT].problems.json
   (create it on first failing cycle; keep it UNTRACKED for now — see schema in
   references/run-artifacts.md).

   Repeat:
     a. total_cycles += 1
     b. Run the gates in order (a later gate only runs if earlier ones pass):
        - GATE 1 (version): @angular/core in package.json reads [NEXT]
          (not BASELINE_VERSION). If unchanged, the update didn't apply.
        - GATE 2 (lint): npm run lint / yarn lint / ng lint (per project).
        - GATE 3 (build): npm run build / yarn build / ng build (per project).
        - GATE 4 (unit tests, if RUN_UNIT_TESTS): run non-interactively. PASS = every
          test in BASELINE_TESTS still passes. A test green at baseline that now fails
          is a REGRESSION → a failure. Re-run a newly-failing test once to rule out
          flakiness. Pre-existing baseline failures are out of scope. N/A if no suite.
        - GATE 5 (e2e tests) — governed by `E2E_GATE`:
          * `off` or `final-only`: do NOT run e2e in this loop (final-only runs once
            after the last version step; see phase 4 Finish).
          * `each-cycle`: run e2e headless every cycle, same regression semantics as
            GATE 4.
          * `per-step`: run e2e headless only on a cycle where GATES 1–4 all pass; if
            e2e then regresses, those failures become problems and the loop continues
            to fix them (so e2e isn't run while the build is still broken).
          N/A if no suite. (See references/test-gates.md for runner discovery,
          non-interactive flags, and flakiness handling.)
     c. FAILING = set of error signatures across all gates.
        If FAILING is empty → outcome = VALIDATED, break.
     d. Reconcile against the registry BY SIGNATURE, then update counters:
        - Match each FAILING signature to an existing problem by signature.
          Matched → reuse its ID. Unmatched → mint the next ID
          [CURRENT]-[NEXT]-<NNN> and add the problem (status "open").
        - Signature in prev_failing but gone now = RESOLVED → set the problem's
          status "resolved", record resolved_cycle, drop it from stalls.
          (Progress. Costs nothing.)
        - Signature you targeted last cycle that is STILL present → stalls[sig] += 1
          and set the problem's attempts = stalls[sig].
        - Brand-new signature (including one your last fix introduced) →
          stalls[sig] = 0 (fresh budget of its own).
        - Write the updated registry to problems.json now (so state survives a crash).
     e. Termination checks (BEFORE fixing again):
        - If any stalls[sig] >= MAX_FIX_ATTEMPTS → mark that problem "stuck" →
          outcome = STUCK(id), break.
        - If total_cycles >= MAX_TOTAL_CYCLES → outcome = NOT_CONVERGING, break.
        - If |FAILING| > |prev_failing|: grew_streak += 1 else grew_streak = 0.
          If grew_streak >= 2 → fixes are regressing → outcome = NOT_CONVERGING, break.
     f. For each current FAILING signature, CONSULT the known-problems ledger
        before fixing (derive its problem class; see references/known-problems.md):
        - If a known working solution exists for the class → try it FIRST, adapted
          to this file (can resolve in one cycle instead of rediscovering).
        - Build the EXCLUDED set = this problem's own failed history this step ∪ the
          ledger's approaches_that_failed for the class. Pick an approach genuinely
          DIFFERENT from everything excluded — never re-try a known-dead approach.
        Apply only TARGETED fixes caused by this upgrade; consult
        [VERSION_UPDATE_GUIDE_URL] for the documented breaking change behind each.
        Append a history entry to each problem
        { cycle, attempt, action: "<what changed>", result: "<pending>" } and log:
        "problem <ID>: attempt <stalls[sig]+1>/[MAX_FIX_ATTEMPTS] — <change>".
        Update the ledger on outcome: resolved → confirm the working approach;
        persisted/stuck → record the failed approach with a short note.
        Set prev_failing = FAILING and continue.

   After the loop: if VALIDATED → step 5; else (STUCK or NOT_CONVERGING) → step 6.

   WHAT COUNTS TOWARD THE BUDGET:
   - The budget is per-problem. A dozen broken pages from ONE breaking change is
     ONE problem — if a single fix clears them, that's resolved in one cycle and
     no budget is spent.
   - A dozen genuinely DIFFERENT errors are a dozen problems, each with its own
     [MAX_FIX_ATTEMPTS] budget; steadily clearing them over several cycles is fine.
   - A counter rises ONLY when the SAME problem survives a fix aimed at it.
     Progress on other problems never consumes another problem's budget.

   LOOP GUARDRAILS:
   - NEVER weaken a gate to force a pass: no disabling lint rules, no skipping the
     build, no // @ts-nocheck, no deleting failing files/tests. A bypassed gate is
     a FAILURE, not a pass (and it doesn't make the underlying problem "resolved").
   - Only fix upgrade-induced issues. Do NOT make unrelated feature changes.

5. Commit (only after VALIDATED)
   - Finalize the registry: set status "success", outcome VALIDATED, and render the
     human report docs/angular-upgrade/<run-id>/steps/[CURRENT]-to-[NEXT].md from it.
     Update run.md's index row for this step.
   - git add -A  (this stages the code changes, the step's report + registry, and
     the updated known-problems ledger)
   - git commit -m "upgrade: angular [CURRENT] → [NEXT]"
   - Do NOT push.
   - Report SUCCESS: version confirmed, cycles used, problem IDs + how each resolved.

6. Escalation (STUCK or NOT_CONVERGING)
   - Record every failed approach for the unresolved problem(s) into the
     known-problems ledger (so the NEXT run tries something different), then finalize
     the registry: set status "failed" and outcome (STUCK id / NOT_CONVERGING),
     and render the human report [CURRENT]-to-[NEXT].md + update run.md's index row.
     Leave these artifacts and the ledger UNTRACKED (do not git add them).
   - If ROLLBACK_ON_FAILURE: git reset --hard LAST_GOOD_COMMIT and reinstall deps.
     The untracked report/registry survive the reset and stay on disk.
   - Report FAILED_AFTER_RETRIES using the failure report format, referencing the
     problem IDs and the on-disk path of the report.
   - STOP. Do not attempt further versions.

CRITICAL CONSTRAINTS
- Only [CURRENT] → [NEXT]; no further versions.
- ng update runs exactly once; retries only re-validate and fix.
- A step is successful ONLY if version + lint + build + unit tests all pass with no
  regressions on the SAME attempt, and the e2e gate is satisfied per `E2E_GATE`
  (each-cycle/per-step: passed within the step; final-only: deferred to the end;
  off: not required). A gate that is N/A (no such suite) is fine; a gate that
  couldn't run is NOT a pass.
- Do NOT apply optional code migrations unless the update guide mandates it.
- Adapt commands to the project's actual setup (npm vs yarn vs pnpm).
- Discover project structure autonomously; don't assume paths.
```

## Failure report format (show to the user on escalation)

When a step reports `FAILED_AFTER_RETRIES`, halt the run and surface a report like this:

```
⛔ Angular upgrade halted at [CURRENT] → [NEXT]

Could not validate this version. The working tree was rolled back to the last
successful commit (angular [PREV_GOOD]).

Reason: [STUCK on one problem | NOT_CONVERGING (fixes regressing/oscillating)]
Failing gate(s): [version | lint | build | unit tests | e2e tests]
Full report: docs/angular-upgrade/<run-id>/steps/[CURRENT]-to-[NEXT].md (on disk, survived rollback)

If STUCK — the one unresolved problem (hit [MAX_FIX_ATTEMPTS] attempts):
  [PROBLEM_ID] <error signature> in <file(s)>
  Attempts on it:
    1. Fixed: <change>  → same error persisted
    2. Fixed: <change>  → same error persisted
    3. Fixed: <change>  → same error persisted

If NOT_CONVERGING — why fixes didn't settle:
  <e.g. "[15-16-002] fix kept reintroducing [15-16-004] over N cycles" / "failing-error
   count grew two cycles running"> after [total_cycles] cycles.
  Problems still open: [list of IDs + signatures]

Final error output:
  <trimmed but actionable error log>

Likely cause:
  <diagnosis, referencing the relevant breaking change from the update guide>

Suggested next steps:
  - <specific manual action 1>
  - <specific manual action 2>
  - Re-run this upgrade after resolving, or do this single step manually.

Progress so far: [versions already upgraded and committed]
```

Earlier successful steps remain committed, so no verified work is lost.

## Guardrails summary

- **Bounded, per-problem self-correction** — the retry budget is spent per distinct problem (same error signature), not per cycle, so honest progress on a large upgrade isn't punished. A single problem gets `MAX_FIX_ATTEMPTS` (default 3) tries before it escalates as STUCK; a `MAX_TOTAL_CYCLES` backstop (default 10) plus a regression check catch non-converging/oscillating fixes. Never loop indefinitely.
- **Honest gates** — success needs version + lint + build + unit tests to pass together with no regressions from the pre-upgrade baseline; the e2e gate runs on the cadence set by `E2E_GATE`. Gates are never disabled, skipped, or faked as N/A to force green.
- **Green baseline first** — don't start on a project that doesn't already build.
- **Fail loud, fail safe** — on exhaustion, roll back the failing step, halt the run, and give the user an actionable report.
- **One commit per validated version** — easy to see which version caused issues and to roll back cleanly.
- **Everything documented** — each run writes a per-step problem registry (with stable IDs) and human report under `docs/angular-upgrade/<run-id>/`; committed on success, preserved on disk through rollback on failure.
- **Self-improving across runs** — a persistent known-problems ledger records which fixes worked and which approaches failed per problem class; subagents consult it before fixing to reuse good solutions and try something different instead of repeating a dead end.

## Reference files

- `references/run-artifacts.md` — where and how to document the run: the `docs/angular-upgrade/<run-id>/` folder layout and naming, the problem-ID scheme, the `problems.json` registry schema, the report templates, and the commit-vs-rollback preservation rule. Read this before writing any run artifacts.
- `references/known-problems.md` — the cross-run learning ledger at `docs/angular-upgrade/known-problems.json`: problem-class matching, schema, and how a subagent consults it to reuse working fixes and avoid previously-failed approaches. Read this before attempting fixes.
- `references/test-gates.md` — the unit and e2e test gates: how to discover the runners (Karma/Jest/Vitest, Cypress/Playwright), run them non-interactively/headless, capture the pre-upgrade baseline, judge regressions vs pre-existing failures, and handle flakiness. Read this before running the test gates.
- `references/version-matrix.md` — official Angular update-guide URLs for each version transition (9→10 through 20→21, plus how to extend beyond 21). Read this in phase 1 to fetch the correct guide URL per step.
- `references/migrations.md` — optional post-upgrade code migrations (standalone components, control flow, `inject()`, signal inputs, cleanup migrations). Only relevant after all version upgrades are complete, and only if the user wants to modernize.