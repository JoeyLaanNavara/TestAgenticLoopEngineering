#!/usr/bin/env node
/**
 * same-error.mjs — normalize a stderr blob into a stable "error key".
 *
 * Two runs of the same underlying failure (different absolute paths, different
 * line:col numbers) must yield the *same* key, so the loop's "≤3 attempts on the
 * same error" budget (see docs/plan/01-git-isolation-and-termination.md) can be
 * enforced mechanically.
 *
 * Preserves compiler/runtime error codes (TS2345, ERR_MODULE_NOT_FOUND, …) since
 * those are the stable identity of the error.
 *
 * Usage:
 *   import { normalizeError } from './same-error.mjs';
 *   const key = normalizeError(stderrText);
 *
 * CLI:
 *   node same-error.mjs "<stderr text>"      # from first arg
 *   echo "<stderr>" | node same-error.mjs    # from stdin
 */

/**
 * @param {string} stderr raw stderr text (possibly multi-line)
 * @returns {string} a stable, path/line-independent error key
 */
export function normalizeError(stderr) {
  if (stderr == null) return '';
  const text = String(stderr);

  // 1. First non-empty, non-whitespace line.
  let line = '';
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed) {
      line = trimmed;
      break;
    }
  }
  if (!line) return '';

  let s = line;

  // 2. Strip file paths (absolute + relative) but keep the trailing basename-ish
  //    token out of the noise. We drop path-looking tokens entirely.
  //    Matches things like /Users/x/y/z.tsx, ./src/a/b.css, ../foo/bar.ts,
  //    packages/core/src/components/ds-x/ds-x.tsx
  s = s.replace(
    /(?:\.{1,2}\/|\/|[A-Za-z]:\\)?(?:[\w.@-]+[\/\\])+[\w.@-]+\.[A-Za-z0-9]+/g,
    '<path>'
  );
  // Bare directory-ish paths with 2+ segments (no extension), e.g. src/components/ds-x
  s = s.replace(/(?:[\w.@-]+\/){2,}[\w.@-]+/g, '<path>');
  // Bare filenames with a source-file extension and no directory, e.g. ds-x.tsx,
  // main.ts, styles.css — normalized so a filename-only reference and a full path
  // to the same file collapse to the same key.
  s = s.replace(
    /\b[\w.@-]+\.(?:tsx?|jsx?|mjs|cjs|css|scss|json|html|vue|d\.ts)\b/g,
    '<path>'
  );

  // 3. Strip line:col coordinates in a variety of shapes.
  //    "(12:5)"  ":12:5"  " 12:5 "  "line 12, column 5"  "L12"
  s = s.replace(/\(\d+\s*[:,]\s*\d+\)/g, '');            // (12:5) / (12,5)
  s = s.replace(/:\d+:\d+/g, '');                         // :12:5
  s = s.replace(/\bline\s+\d+(?:\s*,?\s*col(?:umn)?\s+\d+)?/gi, ''); // line 12, column 5
  s = s.replace(/\bL\d+(?::\d+)?\b/g, '');                // L12 / L12:5

  // 4. Strip standalone :NN (line-only) references, but NOT error codes.
  s = s.replace(/:\d+\b/g, '');

  // 5. Neutralize bare numbers that are almost always positional noise,
  //    while PRESERVING known error-code shapes (TS1234, ERR_*, EXXX).
  //    Protect codes first by masking them with a NON-numeric placeholder so
  //    the number-blanking step below cannot clobber the placeholder itself.
  const protectedCodes = [];
  s = s.replace(/\b(?:TS\d+|ERR_[A-Z0-9_]+|E[A-Z]{2,}|[A-Z]{2,}\d{2,})\b/g, (m) => {
    protectedCodes.push(m);
    return `__CODE${protectedCodes.length - 1}__`;
  });
  // Now blank out remaining standalone numbers (line refs, counts, sizes),
  // but never blank digits that belong to a __CODEn__ placeholder.
  s = s.replace(/\b\d+\b/g, (m, offset, str) => {
    if (str.slice(Math.max(0, offset - 6), offset).includes('__CODE')) return m;
    return '';
  });
  // Restore protected codes.
  s = s.replace(/__CODE(\d+)__/g, (_, i) => protectedCodes[Number(i)]);

  // 6. Collapse whitespace and trim leftover punctuation runs.
  s = s.replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/\s+([,.;:])/g, '$1'); // "foo ." -> "foo."
  s = s.replace(/[\s,;:.\-]+$/g, '').trim();

  return s;
}

// ── CLI ───────────────────────────────────────────────────────────────
function isMain() {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

if (isMain()) {
  (async () => {
    const argText = process.argv.slice(2).join(' ');
    const input = argText || (await readStdin());
    process.stdout.write(normalizeError(input) + '\n');
  })().catch((err) => {
    process.stderr.write(`same-error: ${err?.message || err}\n`);
    process.exit(1);
  });
}
