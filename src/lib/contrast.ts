/**
 * WCAG 2.x contrast ratio (relative luminance formula, spec §1.4.3).
 * Used by tests/unit/contrast.test.ts's contrast-regression suite.
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

function linearToSrgb(channel: number): number {
  const c = channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
  return c * 255;
}

function rgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToRgb([L, a, b]: [number, number, number]): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

/**
 * Mixes two colors the way `linear-gradient(in oklab, ...)` does (globals.css's
 * `.signature-gradient`) — sRGB channel lerp crosses a desaturated olive belt
 * between a dark blue and a gold, which is exactly what that gradient was
 * redone to avoid; verifying its contrast means replicating the same
 * perceptually-uniform interpolation, not the plain sRGB one this file
 * otherwise uses everywhere else.
 */
export function mixOklab(hexA: string, hexB: string, t: number): string {
  const a = rgbToOklab(hexToRgb(hexA));
  const b = rgbToOklab(hexToRgb(hexB));
  const mixed = a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
  const [r, g, bch] = oklabToRgb(mixed).map((v) => Math.round(Math.max(0, Math.min(255, v))));
  return `#${[r, g, bch].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const WCAG_AA_NORMAL_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3;

export function passesAA(ratio: number, isLargeText = false): boolean {
  return ratio >= (isLargeText ? WCAG_AA_LARGE_TEXT : WCAG_AA_NORMAL_TEXT);
}
