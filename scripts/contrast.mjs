#!/usr/bin/env node
/**
 * contrast.mjs — WCAG 2.x relative-luminance contrast ratio between two colors.
 *
 * Supports #rgb and #rrggbb (with or without leading '#').
 * computeContrast('#000', '#fff') === 21 (to within float rounding).
 *
 * Reference: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * Usage:
 *   import { computeContrast, parseHex } from './contrast.mjs';
 * CLI:
 *   node contrast.mjs '#000000' '#ffffff'   -> prints "21.00"
 */

/**
 * Parse a hex color into {r,g,b} 0-255. Returns null on unparseable input.
 * @param {string} hex
 * @returns {{r:number,g:number,b:number}|null}
 */
export function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Relative luminance of an sRGB color (0..1).
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {number}
 */
export function relativeLuminance({ r, g, b }) {
  const channel = (c8) => {
    const c = c8 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const R = channel(r);
  const G = channel(g);
  const B = channel(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * WCAG contrast ratio between two hex colors. Throws if a color is unparseable.
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number} ratio in [1, 21]
 */
export function computeContrast(hex1, hex2) {
  const a = parseHex(hex1);
  const b = parseHex(hex2);
  if (!a || !b) {
    throw new Error(`invalid hex color(s): ${JSON.stringify(hex1)}, ${JSON.stringify(hex2)}`);
  }
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── CLI ───────────────────────────────────────────────────────────────
function isMain() {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
}

if (isMain()) {
  const [fg, bg] = process.argv.slice(2);
  if (!fg || !bg) {
    process.stderr.write('usage: node contrast.mjs <fg-hex> <bg-hex>\n');
    process.exit(1);
  }
  try {
    const ratio = computeContrast(fg, bg);
    process.stdout.write(ratio.toFixed(2) + '\n');
  } catch (err) {
    process.stderr.write(`contrast: ${err.message}\n`);
    process.exit(1);
  }
}
