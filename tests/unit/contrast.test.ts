import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  blendOverBackground,
  contrastRatio,
  passesAA,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/contrast";
import { calendarColorTokens, colorTokens } from "@/lib/design-tokens";
import { PILLAR_IMAGE_FIT, PILLAR_OVERLAY_OPACITY } from "@/components/sections/Pillars";

/**
 * Reads every `--color-*` custom property out of the @theme block, split
 * into the brand layer and the calendar layer (the `cal-` prefix). The
 * character class includes `-` — the original pattern here only matched
 * `[a-z]+`, which happened to work while every color name was a single
 * word, but would have silently let `--color-cal-innolab` etc. through
 * unmatched (a hyphenated name isn't `[a-z]+`), so the drift check below
 * would never have noticed the calendar layer diverging from
 * design-tokens.ts at all.
 */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function readCssColorTokens(): { tokens: Record<string, string>; calendarTokens: Record<string, string> } {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
  const tokens: Record<string, string> = {};
  const calendarTokens: Record<string, string> = {};
  for (const match of css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    const [, name, value] = match;
    if (name.startsWith("cal-")) {
      calendarTokens[name] = value;
    } else {
      tokens[name] = value;
    }
  }
  return { tokens, calendarTokens };
}

describe("design tokens: color contrast", () => {
  const { tokens: cssTokens, calendarTokens: cssCalendarTokens } = readCssColorTokens();

  it("keeps src/lib/design-tokens.ts in sync with the @theme colors in globals.css", () => {
    expect(cssTokens).toEqual(colorTokens);
  });

  it("keeps the calendar color layer in sync with globals.css, separately from the brand tokens", () => {
    expect(cssCalendarTokens).toEqual(calendarColorTokens);
  });

  const { ink, gold, paper, sand, oxblood, moss, amber } = cssTokens;

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

  it("Badge active — paper text on a moss (green) fill — passes AA", () => {
    expect(passesAA(contrastRatio(paper, moss))).toBe(true);
  });

  it("Badge paused — amber (yellow) text on paper — passes AA", () => {
    expect(passesAA(contrastRatio(amber, paper))).toBe(true);
  });

  it("a saturated, un-muted yellow fails AA on paper — this is why paused uses amber, not a bright yellow", () => {
    expect(passesAA(contrastRatio("#ffeb3b", paper))).toBe(false);
  });

  // .signature-gradient (globals.css) — the shared navy-to-gold background
  // on /events' Journeys section and /projekte's active-projects section.
  // Redone 2026-08-19 as a plain two-stop gradient, real tokens at both
  // ends, no color-mix() — see the utility's own comment for why the
  // AA-everywhere constraint that used to force both stops toward paper no
  // longer applies (both consumers put text on opaque cards, never
  // directly on this background). This is a drift guard, not an AA check:
  // it fails if a future edit quietly reintroduces a color-mix() and washes
  // the endpoints out toward paper again, the exact regression this
  // replaced.
  describe(".signature-gradient runs the real tokens at both ends, unmixed", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
    const declaration = css.match(/@utility signature-gradient \{[\s\S]*?\}/)?.[0] ?? "";

    it("starts at --color-ink and ends at --color-gold, with no color-mix()", () => {
      expect(declaration).toContain("linear-gradient(to right, var(--color-ink), var(--color-gold))");
      expect(declaration).not.toContain("color-mix");
    });

    it("the left (navy) end reads unambiguously blue: blue channel dominates red and green", () => {
      const [r, g, b] = hexToRgb(ink);
      expect(b).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(g);
    });

    it("the right (gold) end reads unambiguously warm/gold: red and green dominate blue", () => {
      const [r, g, b] = hexToRgb(gold);
      expect(r).toBeGreaterThan(b);
      expect(g).toBeGreaterThan(b);
    });
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

  it("the ESG pillar's SDG wheel is the case the worst-case-white checks above are actually for", () => {
    // The two checks above use "#ffffff" as a stand-in for the brightest any
    // pillar photo could show — this test names why that stand-in isn't
    // theoretical for `esg` specifically. Its image is object-contain (see
    // PILLAR_IMAGE_FIT in Pillars.tsx), chosen precisely so the whole wheel
    // — including its white background, not just an arbitrarily cropped arc
    // of it — sits behind the scrim. So for this one pillar, worst-case-white
    // isn't a hypothetical upper bound; it's close to the real photo.
    expect(PILLAR_IMAGE_FIT.esg).toBe("contain");
    const worstCaseBackground = blendOverBackground(ink, PILLAR_OVERLAY_OPACITY, "#ffffff");
    expect(passesAA(contrastRatio(paper, worstCaseBackground))).toBe(true);
  });
});

describe("calendar category colors", () => {
  const { tokens: cssTokens, calendarTokens: cssCalendarTokens } = readCssColorTokens();
  const { ink, gold, paper, oxblood } = cssTokens;
  const {
    "cal-innolab": calInnolab,
    "cal-projekte": calProjekte,
    "cal-journeys": calJourneys,
    "cal-wettkaempfe": calWettkaempfe,
    "cal-socials": calSocials,
    "cal-workshops": calWorkshops,
    "cal-bewerbung": calBewerbung,
  } = cssCalendarTokens;

  it("reuses the existing gold and oxblood tokens rather than defining new duplicate colors", () => {
    // wettkaempfe is the signature gold, bewerbung is oxblood — the palette
    // was chosen to reuse both rather than invent two near-duplicate hues,
    // and this keeps that intentional whether or not it stays visible from
    // the hex values alone.
    expect(calWettkaempfe).toBe(gold);
    expect(calBewerbung).toBe(oxblood);
  });

  it("the six outline categories pass AA as text on paper", () => {
    for (const color of [calInnolab, calProjekte, calJourneys, calSocials, calWorkshops, calBewerbung]) {
      expect(passesAA(contrastRatio(color, paper))).toBe(true);
    }
  });

  it("wettkaempfe (gold) fails AA as text on paper — it is the one filled category, never an outline", () => {
    expect(passesAA(contrastRatio(calWettkaempfe, paper))).toBe(false);
  });

  it("ink on the wettkaempfe fill passes AA — the only category with a filled background", () => {
    expect(passesAA(contrastRatio(ink, calWettkaempfe))).toBe(true);
  });

  // A past wettkaempfe row keeps its gold fill (it's the one category that
  // can't be dimmed by dropping the fill, see the outline-categories case
  // below) and mutes its title/meta text instead. ink/60 is this project's
  // documented minimum for muted text — but that figure was measured
  // against paper, not against a fill this bright, and doesn't transfer:
  // measured here at 4.30:1, below the 4.5:1 floor. ink/70 is the value
  // actually used, measured at 5.78:1.
  it("ink at 60% opacity fails AA on the wettkaempfe fill — muted text needs a different value there", () => {
    const muted = blendOverBackground(ink, 0.6, calWettkaempfe);
    expect(passesAA(contrastRatio(muted, calWettkaempfe))).toBe(false);
  });

  it("ink at 70% opacity passes AA on the wettkaempfe fill — the value a past wettkaempfe row actually uses", () => {
    const muted = blendOverBackground(ink, 0.7, calWettkaempfe);
    expect(passesAA(contrastRatio(muted, calWettkaempfe))).toBe(true);
  });
});
