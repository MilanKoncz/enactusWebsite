/**
 * WCAG 2.x contrast ratio (relative luminance formula, spec §1.4.3).
 * Used by the styleguide page and its contrast-regression test.
 */

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexA);
  const luminanceB = relativeLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Flattens a translucent foreground (e.g. ink at 60% opacity, our "muted
 * text" rule) onto an opaque background, so its effective contrast can be
 * measured the same way the browser renders it.
 */
export function blendOverBackground(
  foregroundHex: string,
  alpha: number,
  backgroundHex: string,
): string {
  const fg = hexToRgb(foregroundHex);
  const bg = hexToRgb(backgroundHex);
  const mixed = fg.map((channel, i) => Math.round(channel * alpha + bg[i] * (1 - alpha)));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const WCAG_AA_NORMAL_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3;

export function passesAA(ratio: number, isLargeText = false): boolean {
  return ratio >= (isLargeText ? WCAG_AA_LARGE_TEXT : WCAG_AA_NORMAL_TEXT);
}
