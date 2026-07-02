#!/usr/bin/env bash
#
# rollback.sh — stage rollback for the autonomous loop.
# See docs/plan/01-git-isolation-and-termination.md (section C: Escalation + rollback).
#
# Usage:
#   rollback.sh <mode> <component-tag>
#     mode = create | bugfix
#
#   create  — discard everything under packages/core/src/components/<tag>/:
#             git restore (tracked) + git clean -fd (untracked). Full reset of the dir.
#   bugfix  — restore the component source but PRESERVE any repro test
#             (*.spec.tsx / *.e2e.ts): stash the tests, restore source, reapply tests.
#
# Safety:
#   • Refuses to run on main/master.
#   • Never touches anything outside the component dir.
#   • Echoes each action.
#
set -euo pipefail

usage() {
  echo "usage: rollback.sh <create|bugfix> <component-tag>" >&2
  exit 2
}

MODE="${1:-}"
TAG="${2:-}"

if [[ -z "$MODE" || -z "$TAG" ]]; then
  usage
fi

if [[ "$MODE" != "create" && "$MODE" != "bugfix" ]]; then
  echo "error: mode must be 'create' or 'bugfix' (got '$MODE')" >&2
  usage
fi

# Validate tag shape to prevent path escapes (must be a plain ds-like tag).
if [[ ! "$TAG" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "error: invalid component tag '$TAG' (allowed: letters, digits, - and _)" >&2
  exit 2
fi

# Must be inside a git repo.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: not inside a git work tree" >&2
  exit 1
fi

# Refuse on main/master.
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "REFUSING to roll back on protected branch '$BRANCH'." >&2
  echo "Rollback only runs on throwaway auto/* branches." >&2
  exit 1
fi

# Resolve repo root and the component dir (relative path kept scoped).
REPO_ROOT="$(git rev-parse --show-toplevel)"
COMPONENT_REL="packages/core/src/components/${TAG}"
COMPONENT_DIR="${REPO_ROOT}/${COMPONENT_REL}"

echo "rollback: mode=${MODE} tag=${TAG} branch=${BRANCH}"
echo "rollback: target dir = ${COMPONENT_REL}/"

if [[ ! -d "$COMPONENT_DIR" ]]; then
  echo "rollback: note — component dir does not exist; treating as clean (nothing tracked to restore, cleaning any untracked)."
fi

cd "$REPO_ROOT"

if [[ "$MODE" == "create" ]]; then
  echo "rollback[create]: git restore --source=HEAD --staged --worktree -- ${COMPONENT_REL}/ (if tracked)"
  # Restore tracked files in the dir (ignore error if pathspec matches nothing).
  git restore --source=HEAD --staged --worktree -- "${COMPONENT_REL}/" 2>/dev/null \
    || echo "rollback[create]: nothing tracked to restore under ${COMPONENT_REL}/"

  echo "rollback[create]: git clean -fd -- ${COMPONENT_REL}/ (remove untracked files/dirs)"
  git clean -fd -- "${COMPONENT_REL}/" || true

  echo "rollback[create]: done."
  exit 0
fi

# ── bugfix mode ──
# Preserve repro tests (*.spec.tsx, *.e2e.ts) while restoring the source.
if [[ "$MODE" == "bugfix" ]]; then
  STASH_DIR="$(mktemp -d "${TMPDIR:-/tmp}/rollback-tests.XXXXXX")"
  echo "rollback[bugfix]: preserving repro tests to ${STASH_DIR}"

  PRESERVED=0
  if [[ -d "$COMPONENT_DIR" ]]; then
    # Copy any spec/e2e test files, preserving their relative layout.
    while IFS= read -r -d '' f; do
      rel="${f#"$COMPONENT_DIR"/}"
      mkdir -p "${STASH_DIR}/$(dirname "$rel")"
      cp -p "$f" "${STASH_DIR}/${rel}"
      echo "rollback[bugfix]: stashed ${COMPONENT_REL}/${rel}"
      PRESERVED=$((PRESERVED + 1))
    done < <(find "$COMPONENT_DIR" -type f \( -name '*.spec.tsx' -o -name '*.spec.ts' -o -name '*.e2e.ts' \) -print0)
  fi
  echo "rollback[bugfix]: preserved ${PRESERVED} test file(s)"

  echo "rollback[bugfix]: git restore --source=HEAD --staged --worktree -- ${COMPONENT_REL}/ (restore source)"
  git restore --source=HEAD --staged --worktree -- "${COMPONENT_REL}/" 2>/dev/null \
    || echo "rollback[bugfix]: nothing tracked to restore under ${COMPONENT_REL}/"

  echo "rollback[bugfix]: git clean -fd -- ${COMPONENT_REL}/ (drop untracked NON-test files)"
  # Clean untracked files but exclude the test patterns so an untracked repro test survives.
  git clean -fd \
    -e '*.spec.tsx' -e '*.spec.ts' -e '*.e2e.ts' \
    -- "${COMPONENT_REL}/" || true

  echo "rollback[bugfix]: reapplying preserved repro tests"
  if [[ "$PRESERVED" -gt 0 ]]; then
    mkdir -p "$COMPONENT_DIR"
    # Reapply, overwriting whatever restore produced (tests take precedence).
    ( cd "$STASH_DIR" && find . -type f -print0 ) | while IFS= read -r -d '' rel; do
      rel="${rel#./}"
      mkdir -p "${COMPONENT_DIR}/$(dirname "$rel")"
      cp -p "${STASH_DIR}/${rel}" "${COMPONENT_DIR}/${rel}"
      echo "rollback[bugfix]: reapplied ${COMPONENT_REL}/${rel}"
    done
  fi

  rm -rf "$STASH_DIR"
  echo "rollback[bugfix]: done (source reverted, repro test(s) preserved)."
  exit 0
fi
