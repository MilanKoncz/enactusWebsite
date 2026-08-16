import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  blendOverBackground,
  contrastRatio,
  passesAA,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/contrast";
import { colorTokens } from "@/lib/design-tokens";
import { PILLAR_OVERLAY_OPACITY } from "@/components/sections/Pillars";

function readCssColorTokens(): Record<string, string> {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--color-([a-z]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

describe("design tokens: color contrast", () => {
  const cssTokens = readCssColorTokens();

  it("keeps src/lib/design-tokens.ts in sync with the @theme colors in globals.css", () => {
    expect(cssTokens).toEqual(colorTokens);
  });

  const { ink, gold, paper, sand, oxblood } = cssTokens;

  it("text on gold is ink and passes AA — the one rule with no exceptions", () => {
    const ratio = contrastRatio(ink, gold);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    expect(passesAA(ratio)).toBe(true);
  });

  it("ink body text on paper passes AA", () => {
    expect(passesAA(contrastRatio(ink, paper))).toBe(true);
  });

  it("paper text on ink, for full-bleed dark sections, passes AA", () => {
    expect(passesAA(contrastRatio(paper, ink))).toBe(true);
  });

  it("sand text on ink passes AA", () => {
    expect(passesAA(contrastRatio(sand, ink))).toBe(true);
  });

  it("muted text on paper (ink at 60% opacity, the documented minimum) still passes AA", () => {
    const muted = blendOverBackground(ink, 0.6, paper);
    expect(passesAA(contrastRatio(muted, paper))).toBe(true);
  });

  it("Eyebrow's muted treatment (60% opacity) also passes AA on the ink surface", () => {
    const muted = blendOverBackground(paper, 0.6, ink);
    expect(passesAA(contrastRatio(muted, ink))).toBe(true);
  });

  it("Badge cancelled — oxblood text on paper — passes AA", () => {
    expect(passesAA(contrastRatio(oxblood, paper))).toBe(true);
  });

  it("sand on paper fails AA — this combination must never ship", () => {
    expect(passesAA(contrastRatio(sand, paper))).toBe(false);
  });

  it("gold text on paper fails AA — gold is never a text color", () => {
    expect(passesAA(contrastRatio(gold, paper))).toBe(false);
  });

  it("paper text over a pillar's photo overlay still passes AA, even against a worst-case near-white photo", () => {
    // "#ffffff" stands in for the brightest patch any pillar photo could
    // ever show behind the text — the actual photos (an SDG-wheel graphic,
    // a project photo, a stage photo) are all darker than pure white
    // somewhere, so this is deliberately harder than the real case, not a
    // realistic average.
    const worstCaseBackground = blendOverBackground(ink, PILLAR_OVERLAY_OPACITY, "#ffffff");
    expect(passesAA(contrastRatio(paper, worstCaseBackground))).toBe(true);
  });

  it("DetailText's muted paper (60% opacity) over a pillar's photo overlay also passes AA against worst-case white", () => {
    // The gap the full-opacity check above doesn't cover: DetailText
    // (components/ui/DetailText.tsx) renders its supporting sentence at
    // opacity-60, not full opacity — a scrim strong enough for the title
    // isn't automatically strong enough for that dimmer text too. This is
    // the exact check that caught PILLAR_OVERLAY_OPACITY at 0.75 (3.97:1,
    // failing) before it was raised to 0.85.
    const worstCaseBackground = blendOverBackground(ink, PILLAR_OVERLAY_OPACITY, "#ffffff");
    const mutedText = blendOverBackground(paper, 0.6, worstCaseBackground);
    expect(passesAA(contrastRatio(mutedText, worstCaseBackground))).toBe(true);
  });
});
