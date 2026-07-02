#!/usr/bin/env node
/**
 * design-lint.mjs — the create-loop oracle.
 * See docs/plan/03-design-lint-and-objective-gates.md.
 *
 * Reads a component's CSS and asserts the mechanical DESIGN.md rules, giving the
 * autonomous "create" loop a deterministic pass/fail signal.
 *
 * HARD-FAIL rules (=> pass:false, exit 1):
 *   (a) raw color literals (#hex, rgb(, rgba(, hsl(, hsla() that are NOT sitting
 *       in a var(--…, <fallback>) fallback position;
 *   (b) references to --ds-* tokens that don't exist in the global.css catalog;
 *   (c) missing :host selector;
 *   (d) a `transition` / `animation` declaration with no
 *       `@media (prefers-reduced-motion: reduce)` block anywhere in the file.
 *   (e) resolvable text/background contrast below 4.5:1 (skipped if unresolvable).
 *
 * WARN rules (reported, pass stays true):
 *   - missing :hover / :focus-visible / :active / disabled / loading hooks;
 *   - legacy --ds-spacing-xs/sm/md/lg/xl aliases;
 *   - no sm|md|lg size handling.
 *
 * Output: JSON { pass, violations:[{severity,rule,detail,line?}], warnings:[...] }
 * Exit 0 if pass else 1.
 *
 * Usage:
 *   node scripts/design-lint.mjs <tag>
 *   node scripts/design-lint.mjs --file path/to/some.css        (override target)
 *   node scripts/design-lint.mjs <tag> --global path/to/global.css
 *   import { lintCss, buildTokenCatalog } from './design-lint.mjs';
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeContrast, parseHex } from './contrast.mjs';

const CORE = 'packages/core/src';
const GLOBAL_CSS_REL = path.join(CORE, 'global', 'global.css');

// ── Comment stripping (keeps line count stable by preserving newlines) ──
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Parse `--ds-*: value;` declarations from global.css into a catalog.
 * Resolves one level of var(--other) references best-effort.
 * @param {string} globalCss
 * @returns {Map<string,string>} token name (with leading --) -> resolved value
 */
export function buildTokenCatalog(globalCss) {
  const src = stripComments(globalCss || '');
  const raw = new Map();
  // Match "--ds-foo: value;" (value up to the next ; not inside parens? keep simple: up to ;)
  const re = /(--ds-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    const name = m[1];
    const value = m[2].trim();
    // If declared multiple times (light/dark), keep the first (light/default).
    if (!raw.has(name)) raw.set(name, value);
  }

  // Resolve one level of var() references: `var(--x)` or `var(--x, fallback)`.
  const resolved = new Map();
  for (const [name, value] of raw) {
    resolved.set(name, resolveOneLevel(value, raw));
  }
  return resolved;
}

function resolveOneLevel(value, raw) {
  return value.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]*))?\)/gi, (full, ref, fb) => {
    if (raw.has(ref)) return raw.get(ref).trim();
    if (fb != null) return fb.trim();
    return full;
  });
}

/**
 * Resolve a token name to a hex color, following up to `depth` var() hops
 * through the catalog. Returns a hex string (#rgb/#rrggbb) or null.
 */
function resolveTokenToHex(name, catalog, depth = 5) {
  let cur = name;
  const seen = new Set();
  for (let i = 0; i < depth; i++) {
    if (!catalog.has(cur) || seen.has(cur)) return null;
    seen.add(cur);
    let val = catalog.get(cur).trim();
    // Direct hex?
    if (parseHex(val)) return val;
    // var(--next, fb)?
    const vm = /^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]*))?\)$/i.exec(val);
    if (vm) {
      const next = vm[1];
      const fb = vm[2];
      if (catalog.has(next)) {
        cur = next;
        continue;
      }
      if (fb && parseHex(fb.trim())) return fb.trim();
      return null;
    }
    return null;
  }
  return null;
}

// ── Line lookup helper ──
function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

/**
 * Detect raw color literals that are NOT in a var() fallback position.
 * A color is "safe" if it appears as the fallback in var(--x, <color>).
 */
function findRawColors(css) {
  const violations = [];
  // Match hex or functional colors.
  const colorRe = /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\s*\(/g;
  let m;
  while ((m = colorRe.exec(css)) !== null) {
    const idx = m.index;
    const token = m[0];
    if (isInVarFallback(css, idx)) continue;
    violations.push({
      severity: 'error',
      rule: 'raw-color-literal',
      detail: `Raw color "${token.replace(/\s*\($/, '(')}" used outside a var(--…, fallback) position. Use a --ds-* token.`,
      line: lineOf(css, idx),
    });
  }
  return violations;
}

/**
 * Determine whether the character offset `idx` sits inside the fallback portion
 * of a var(--x, …) expression. We scan backwards balancing parens; if we find an
 * unmatched "(" that is preceded by "var" AND a comma occurs between that "var("
 * and idx, then idx is in a fallback position.
 */
function isInVarFallback(css, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const c = css[i];
    if (c === ')') depth++;
    else if (c === '(') {
      if (depth === 0) {
        // Found the opening paren of our enclosing function. Is it var(?
        const before = css.slice(Math.max(0, i - 3), i).toLowerCase();
        if (before.endsWith('var')) {
          // Is there a comma between this "(" and idx (a fallback separator)?
          const between = css.slice(i + 1, idx);
          return between.includes(',');
        }
        return false; // enclosing fn is not var()
      }
      depth--;
    }
  }
  return false;
}

/**
 * Find --ds-* token references in the component CSS that are unknown to the
 * catalog.
 *
 * We distinguish two cases so we don't spuriously fail legitimate CSS:
 *   • `var(--ds-x)` with NO fallback and unknown to the catalog and not declared
 *     locally  → HARD FAIL (real typo — nothing would ever resolve it).
 *   • `var(--ds-x, <fallback>)` with a fallback → this is a deliberate consumer
 *     customization hook (the component exposes --ds-x for theming and provides
 *     a safe default). If it's unknown to the catalog it's NOT a typo; at most a
 *     WARN, and only when it doesn't follow the local --ds-<something>-* pattern.
 *
 * Local declarations (`--ds-card-bg: …;` in the same file) are always fine.
 *
 * @returns {{violations:object[], warnings:object[]}}
 */
function findUnknownTokens(css, catalog) {
  const violations = [];
  const warnings = [];
  const seenErr = new Set();
  const seenWarn = new Set();
  // Capture the full var(...) with an optional fallback (group 2 present => has fallback).
  const re = /var\(\s*(--ds-[a-z0-9-]+)\s*(,)?/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1];
    const hasFallback = Boolean(m[2]);

    if (catalog.has(name)) continue;
    // Locally-declared component tokens (e.g. --ds-card-bg) are legitimate.
    if (isLocallyDeclared(css, name)) continue;

    if (hasFallback) {
      // Deliberate customization hook with a default. Not a typo → soft signal.
      if (seenWarn.has(name)) continue;
      seenWarn.add(name);
      warnings.push({
        severity: 'warn',
        rule: 'undeclared-custom-prop',
        detail: `Custom property "${name}" is referenced with a fallback but never declared in :host or global.css. This works (fallback covers it) but declare it in :host for discoverability.`,
        line: lineOf(css, m.index),
      });
    } else {
      // No fallback, unknown, undeclared → genuinely unresolvable → hard fail.
      if (seenErr.has(name)) continue;
      seenErr.add(name);
      violations.push({
        severity: 'error',
        rule: 'unknown-token',
        detail: `Reference to --ds token "${name}" that does not exist in global.css, is not declared locally, and has no fallback (typo — would never resolve).`,
        line: lineOf(css, m.index),
      });
    }
  }
  return { violations, warnings };
}

function isLocallyDeclared(css, name) {
  // Look for "<name>:" as a declaration (property) anywhere in the file.
  const re = new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:`, 'i');
  return re.test(css);
}

/**
 * Best-effort contrast check: resolve a foreground text token and the :host
 * background token to hex and compute the ratio. Skips silently if unresolvable.
 */
function checkContrast(css, catalog) {
  const violations = [];

  // Find the :host { ... } block (first one).
  const hostMatch = /:host\b[^{]*\{([\s\S]*?)\}/.exec(css);
  if (!hostMatch) return violations;
  const hostBody = hostMatch[1];

  const bgToken = extractTokenRef(hostBody, /background(?:-color)?\s*:/i);
  const fgToken = extractTokenRef(hostBody, /(?<!-)\bcolor\s*:/i);

  if (!bgToken || !fgToken) return violations; // uncertain -> skip

  const bgHex = resolveTokenToHex(bgToken, catalog);
  const fgHex = resolveTokenToHex(fgToken, catalog);
  if (!bgHex || !fgHex) return violations; // can't resolve -> skip (no fail on uncertainty)

  let ratio;
  try {
    ratio = computeContrast(fgHex, bgHex);
  } catch {
    return violations;
  }
  if (ratio < 4.5) {
    violations.push({
      severity: 'error',
      rule: 'contrast',
      detail: `:host text/background contrast ${ratio.toFixed(2)}:1 (fg ${fgToken}=${fgHex}, bg ${bgToken}=${bgHex}) is below WCAG AA 4.5:1.`,
    });
  }
  return violations;
}

/**
 * From a declaration body, find `<prop>: … var(--ds-x …) …;` and return the
 * FIRST --ds-* token referenced by that property (the one the value resolves to).
 */
function extractTokenRef(body, propRe) {
  const lines = body.split(';');
  for (const decl of lines) {
    if (propRe.test(decl)) {
      const vm = /var\(\s*(--[a-z0-9-]+)/i.exec(decl);
      if (vm) return vm[1];
      // Direct token-like? none; give up on this decl.
    }
  }
  return null;
}

/**
 * Reduced-motion rule: if the file contains any transition/animation
 * declaration, it must also contain a prefers-reduced-motion:reduce block.
 */
function checkReducedMotion(css) {
  const violations = [];
  // Look for transition/animation *properties* (not the tokens --ds-duration).
  // Match "transition:" / "animation:" / "transition-*:" / "animation-*:"
  const motionDecl = /(?:^|[{;\s])(transition|animation)(?:-[a-z-]+)?\s*:/i;
  const hasMotion = motionDecl.test(css);
  if (!hasMotion) return violations;

  const hasReduced = /@media[^{]*prefers-reduced-motion\s*:\s*reduce/i.test(css);
  if (!hasReduced) {
    const m = motionDecl.exec(css);
    violations.push({
      severity: 'error',
      rule: 'reduced-motion',
      detail:
        'transition/animation declared but no `@media (prefers-reduced-motion: reduce)` block found. ' +
        'Wrap or disable motion for reduced-motion users.',
      line: m ? lineOf(css, m.index) : undefined,
    });
  }
  return violations;
}

// ── WARN checks ──
function warnStates(css) {
  const warnings = [];
  const checks = [
    { rule: 'state-hover', re: /:hover\b/, label: ':hover' },
    { rule: 'state-focus-visible', re: /:focus-visible\b/, label: ':focus-visible' },
    { rule: 'state-active', re: /:active\b/, label: ':active' },
    { rule: 'state-disabled', re: /:disabled\b|\[disabled\]/, label: 'disabled (:disabled or [disabled])' },
    { rule: 'state-loading', re: /loading|\[busy\]|aria-busy/i, label: 'loading hook' },
  ];
  for (const c of checks) {
    if (!c.re.test(css)) {
      warnings.push({
        severity: 'warn',
        rule: c.rule,
        detail: `No ${c.label} interaction-state hook found. DESIGN.md expects all six states for interactive components.`,
      });
    }
  }
  return warnings;
}

function warnLegacySpacing(css) {
  const warnings = [];
  const re = /--ds-spacing-(xs|sm|md|lg|xl)\b/gi;
  const seen = new Set();
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = `--ds-spacing-${m[1].toLowerCase()}`;
    if (seen.has(name)) continue;
    seen.add(name);
    warnings.push({
      severity: 'warn',
      rule: 'legacy-spacing-alias',
      detail: `Legacy spacing alias "${name}" used. Prefer the numbered scale (--ds-space-N).`,
      line: lineOf(css, m.index),
    });
  }
  return warnings;
}

function warnSizeVariants(css) {
  const warnings = [];
  // Heuristic: presence of size handling for sm|md|lg.
  const hasSm = /\bsm\b/.test(css);
  const hasMd = /\bmd\b/.test(css);
  const hasLg = /\blg\b/.test(css);
  if (!(hasSm && hasMd && hasLg)) {
    warnings.push({
      severity: 'warn',
      rule: 'size-variants',
      detail:
        'No clear sm|md|lg size handling detected. Interactive components should expose size="sm|md|lg". ' +
        '(Ignore for non-interactive/layout components.)',
    });
  }
  return warnings;
}

/**
 * Core lint over already-loaded strings. Pure & testable.
 * @param {string} css component css (raw)
 * @param {string} globalCss global.css (raw)
 * @returns {{pass:boolean, violations:object[], warnings:object[]}}
 */
export function lintCss(css, globalCss) {
  const catalog = buildTokenCatalog(globalCss);
  const clean = stripComments(css || '');

  const violations = [];
  const warnings = [];

  // HARD-FAIL rules
  violations.push(...findRawColors(clean));
  const tokenScan = findUnknownTokens(clean, catalog);
  violations.push(...tokenScan.violations);
  warnings.push(...tokenScan.warnings);
  if (!/:host\b/.test(clean)) {
    violations.push({
      severity: 'error',
      rule: 'missing-host',
      detail: 'No :host selector found. Shadow-DOM components must style :host.',
    });
  }
  violations.push(...checkReducedMotion(clean));
  violations.push(...checkContrast(clean, catalog));

  // WARN rules
  warnings.push(...warnStates(clean));
  warnings.push(...warnLegacySpacing(clean));
  warnings.push(...warnSizeVariants(clean));

  return { pass: violations.length === 0, violations, warnings };
}

// ── File loading ──
function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, GLOBAL_CSS_REL))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

/**
 * Lint a component by tag. Loads files from disk.
 * @param {object} opts
 * @param {string} [opts.tag]
 * @param {string} [opts.file] explicit css path (overrides tag lookup)
 * @param {string} [opts.globalPath] explicit global.css path
 * @returns {{pass:boolean, violations:object[], warnings:object[]}}
 */
export function lintComponent({ tag, file, globalPath } = {}) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = findRepoRoot(here);

  const gPath = globalPath || path.join(repoRoot, GLOBAL_CSS_REL);
  let globalCss = '';
  try {
    globalCss = fs.readFileSync(gPath, 'utf8');
  } catch {
    // Degrade: without a catalog, unknown-token can't be checked reliably.
    return {
      pass: false,
      violations: [
        {
          severity: 'error',
          rule: 'missing-global',
          detail: `Could not read global token catalog at ${gPath}. Cannot lint.`,
        },
      ],
      warnings: [],
    };
  }

  let cssPath = file;
  if (!cssPath) {
    if (!tag) {
      return {
        pass: false,
        violations: [{ severity: 'error', rule: 'usage', detail: 'No component tag or --file provided.' }],
        warnings: [],
      };
    }
    cssPath = path.join(repoRoot, CORE, 'components', tag, `${tag}.css`);
  }

  let css = '';
  try {
    css = fs.readFileSync(cssPath, 'utf8');
  } catch {
    return {
      pass: false,
      violations: [
        { severity: 'error', rule: 'missing-css', detail: `Component CSS not found at ${cssPath}.` },
      ],
      warnings: [],
    };
  }

  return lintCss(css, globalCss);
}

// ── CLI ───────────────────────────────────────────────────────────────
function isMain() {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const out = { tag: undefined, file: undefined, globalPath: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') out.file = argv[++i];
    else if (a === '--global') out.globalPath = argv[++i];
    else if (!a.startsWith('--') && !out.tag) out.tag = a;
  }
  return out;
}

if (isMain()) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.tag && !args.file) {
    process.stderr.write(
      'usage: node scripts/design-lint.mjs <tag> [--file path.css] [--global path/global.css]\n'
    );
    process.exit(2);
  }
  let result;
  try {
    result = lintComponent(args);
  } catch (err) {
    result = {
      pass: false,
      violations: [{ severity: 'error', rule: 'internal', detail: String(err?.message || err) }],
      warnings: [],
    };
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.pass ? 0 : 1);
}
