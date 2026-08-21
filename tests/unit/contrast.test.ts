import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  blendOverBackground,
  contrastRatio,
  mixOklab,
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
  // Scoped to the @theme block specifically, not the whole file: the 8-bit
  // easter egg (docs/eastereggs.md) redefines these same custom property
  // names again further down, deliberately — that's how its whole CSS
  // layer works (globals.css's own comment on it) — and a file-wide scan
  // would pick up that second, unrelated palette as if it were a drifted
  // brand token.
  const themeMatch = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  const themeBlock = themeMatch?.[1] ?? "";
  const tokens: Record<string, string> = {};
  const calendarTokens: Record<string, string> = {};
  for (const match of themeBlock.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
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

  // ProjectsActive.tsx overrides Badge's default active fill to bg-moss/35
  // on its ink-surfaced cards (signature-gradient's dark section) — the
  // fully saturated bg-moss fill read as a clashing, unrelated color note
  // there. Composited over the card's own solid --color-ink background
  // (not the gradient — the card is opaque), same math as any other
  // opacity-blended pair in this file.
  it("Badge active on ProjectsActive's ink cards — paper text on moss/35 tinted onto ink — passes AA with real margin", () => {
    const tinted = blendOverBackground(moss, 0.35, ink);
    const ratio = contrastRatio(paper, tinted);
    expect(passesAA(ratio)).toBe(true);
    expect(ratio).toBeGreaterThan(WCAG_AA_NORMAL_TEXT + 5);
  });

  it("Badge paused — amber (yellow) text on paper — passes AA", () => {
    expect(passesAA(contrastRatio(amber, paper))).toBe(true);
  });

  it("a saturated, un-muted yellow fails AA on paper — this is why paused uses amber, not a bright yellow", () => {
    expect(passesAA(contrastRatio("#ffeb3b", paper))).toBe(false);
  });

  // .signature-gradient (globals.css) — the shared navy-to-gold background
  // on /events' Journeys section and /projekte's active-projects section.
  // Redone a fifth time 2026-08-21: every sRGB-interpolated version (see git
  // history) crossed a desaturated olive belt partway through, because a
  // straight sRGB line between a dark blue and a gold always does — widening
  // or narrowing the flat zones only moved where the belt sat, never removed
  // it. This version changes the interpolation itself (`in oklab`, a
  // perceptually uniform space, `@supports`-gated with a same-stops sRGB
  // fallback for older browsers) and routes through a real --color-oxblood
  // middle stop instead of a bare color-interpolation hint, so the path is
  // ink → oxblood → gold — two dark, close-lightness colors first, then one
  // warm leg up to gold, never a blue-to-yellow mix. Flat zones shrink to
  // 12% a side (previously 20%); the transition (12%–88%) now carries 76%
  // of the axis, the majority share the board asked for.
  describe(".signature-gradient: oklab ink→oxblood→gold with a same-stops sRGB fallback, 12% flat zones, no color-mix()", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
    const declaration = css.match(/@utility signature-gradient \{[\s\S]*?\n\}/)?.[0] ?? "";
    const P0 = 12;
    const MID = 60;
    const P1 = 88;

    it("declares a plain sRGB gradient first, then overrides it with an oklab one under @supports — both directions, same three color stops", () => {
      expect(declaration).toContain("to bottom");
      expect(declaration).toContain("to right");
      expect(declaration).toContain("to bottom in oklab");
      expect(declaration).toContain("to right in oklab");
      expect(declaration).toContain("@media (min-width: 48rem)");
      expect(declaration.match(/@supports \(background: linear-gradient\(in oklab, red, blue\)\)/g)).toHaveLength(2);
      // Every stop appears twice per interpolation mode (sRGB fallback +
      // oklab override) and twice per mode across the two axes — 4 total.
      for (const fragment of [
        "var(--color-ink) 0%",
        "var(--color-ink) 12%",
        "var(--color-oxblood) 60%",
        "var(--color-gold) 88%",
        "var(--color-gold) 100%",
      ]) {
        expect(declaration.match(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))).toHaveLength(4);
      }
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

    it("the middle stop (oxblood) reads warm, not olive: red dominates green and blue", () => {
      const [r, g, b] = hexToRgb(oxblood);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    });

    // The color the gradient actually paints at a given % along its axis —
    // two oklab-interpolated legs (ink→oxblood, then oxblood→gold), matching
    // what `linear-gradient(in oklab, ink 0%, ink 12%, oxblood 60%, gold
    // 88%, gold 100%)` computes per the CSS Images spec's multi-stop
    // formula.
    function gradientColorAt(pct: number): string {
      if (pct <= P0) return ink;
      if (pct >= P1) return gold;
      if (pct <= MID) return mixOklab(ink, oxblood, (pct - P0) / (MID - P0));
      return mixOklab(oxblood, gold, (pct - MID) / (P1 - MID));
    }

    // The 7-point sweep this file's own history and globals.css's comment
    // quote directly — one shared curve now, so one sweep covers both axes.
    const SAMPLE_POINTS = [0, 16.67, 33.33, 50, 66.67, 83.33, 100];

    // Real measured text edges — box positions are unchanged from the
    // previous version (no layout moved, only the color function did), so
    // the same Playwright-measured percentages still describe where each
    // text block actually sits.
    const REAL_TEXT_EDGES: Array<{ label: string; pct: number }> = [
      { label: "768px heading/lead right edge", pct: 69.8 },
      { label: "1280px heading/lead right edge", pct: 43.1 },
      { label: "JourneysSection heading+lead block bottom (below md)", pct: 41.2 },
      { label: "ProjectsActive label bottom (below md)", pct: 8.7 },
    ];

    it.each(REAL_TEXT_EDGES)(
      "full-opacity paper heading/lead text clears 4.5:1 at its real measured edge ($label)",
      ({ pct }) => {
        const bg = gradientColorAt(pct);
        expect(passesAA(contrastRatio(paper, bg))).toBe(true);
      },
    );

    // Same real edges, but against the sRGB fallback curve (plain channel
    // lerp, no oklab) — the version a browser without `in oklab` support
    // actually renders. It must clear 4.5:1 too, not just the enhanced path.
    function fallbackColorAt(pct: number): string {
      const mix = (aHex: string, bHex: string, t: number) => {
        const a = hexToRgb(aHex);
        const b = hexToRgb(bHex);
        const mixed = a.map((v, i) => v + (b[i] - v) * t);
        return `#${mixed.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
      };
      if (pct <= P0) return ink;
      if (pct >= P1) return gold;
      if (pct <= MID) return mix(ink, oxblood, (pct - P0) / (MID - P0));
      return mix(oxblood, gold, (pct - MID) / (P1 - MID));
    }

    it.each(REAL_TEXT_EDGES)(
      "the sRGB fallback also clears 4.5:1 at its real measured edge ($label), for browsers without oklab gradient support",
      ({ pct }) => {
        const bg = fallbackColorAt(pct);
        expect(passesAA(contrastRatio(paper, bg))).toBe(true);
      },
    );

    // The curve doesn't fail 4.5:1 until past 75% — every general sample
    // point up to 66.67% clears it too. Past the failure point is the
    // gradient's pure decorative tail, always covered by the two sections'
    // opaque ink-fill/gold-edge cards (JourneysSection.tsx /
    // ProjectsActive.tsx), never by raw text.
    it("paper heading/lead text clears 4.5:1 at every sample point up to 66.67%", () => {
      for (const pct of SAMPLE_POINTS.filter((p) => p <= 66.67)) {
        expect(passesAA(contrastRatio(paper, gradientColorAt(pct)))).toBe(true);
      }
    });

    it("the gradient's pure-gold tail (83.33%/100%) does fail paper-text contrast — by design, always covered by an opaque card, never by raw text", () => {
      expect(passesAA(contrastRatio(paper, gradientColorAt(83.33)))).toBe(false);
      expect(passesAA(contrastRatio(paper, gradientColorAt(100)))).toBe(false);
    });

    it("Eyebrow's opacity-60 treatment clears 4.5:1 anywhere the eyebrow itself can render (it's a short, top-anchored line, always inside the flat 12% ink zone)", () => {
      const bg = gradientColorAt(0);
      const muted = blendOverBackground(paper, 0.6, bg);
      expect(passesAA(contrastRatio(muted, bg))).toBe(true);
    });

    // The full 7-point sweep, both categories — the numbers this file's
    // own history and globals.css's comment quote directly.
    it("records the full 7-point contrast sweep for heading/body and eyebrow text", () => {
      for (const pct of SAMPLE_POINTS) {
        const bg = gradientColorAt(pct);
        const headingBodyRatio = contrastRatio(paper, bg);
        const eyebrowColor = blendOverBackground(paper, 0.6, bg);
        const eyebrowRatio = contrastRatio(eyebrowColor, bg);
        // Every point up to 100% is a real, finite ratio — this test's job
        // is to force the numbers to exist and be inspectable (e.g. via
        // --reporter=verbose), not to assert AA everywhere: the tail past
        // 66.67% is expected to fail, covered by an opaque card, asserted
        // separately above.
        expect(headingBodyRatio).toBeGreaterThan(1);
        expect(eyebrowRatio).toBeGreaterThan(1);
      }
    });
  });

  // Easter egg 3/7 (docs/eastereggs.md): html[data-eight-bit="active"]'s
  // second color palette (globals.css). Read directly from the CSS file
  // rather than hand-copied here, so an edit to one can't silently drift
  // from the other — the same reasoning readCssColorTokens() above exists
  // for the brand palette.
  describe("8-bit mode palette (html[data-eight-bit])", () => {
    const eightBitCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
    const eightBitBlockMatch = eightBitCss.match(
      /html\[data-eight-bit="exiting"\],\s*html\[data-eight-bit="active"\] \{([\s\S]*?)\n {2}\}/,
    );
    const eightBitBlock = eightBitBlockMatch?.[1] ?? "";
    const eightBit: Record<string, string> = {};
    for (const match of eightBitBlock.matchAll(/--color-([a-z]+):\s*(#[0-9a-fA-F]{6});/g)) {
      const [, name, value] = match;
      eightBit[name] = value;
    }

    it("is actually found in globals.css (a sanity check on the regex above, not the palette itself)", () => {
      expect(Object.keys(eightBit).sort()).toEqual(
        ["amber", "gold", "ink", "moss", "oxblood", "paper", "sand"].sort(),
      );
    });

    it("keeps every pair the brand palette relies on at 4.5:1 or better", () => {
      const pairs: Array<[string, string, string]> = [
        ["ink text on gold (Badge spinoff, Button primary, hero rotating term)", eightBit.ink, eightBit.gold],
        ["ink body text on paper", eightBit.ink, eightBit.paper],
        ["paper text on ink (dark sections, footer, Badge active fill)", eightBit.paper, eightBit.ink],
        ["sand text on ink", eightBit.sand, eightBit.ink],
        ["paper text on moss (Badge active fill)", eightBit.paper, eightBit.moss],
        ["amber text on paper (Badge paused)", eightBit.amber, eightBit.paper],
        ["oxblood text on paper (Badge cancelled)", eightBit.oxblood, eightBit.paper],
      ];
      for (const [, fg, bg] of pairs) {
        expect(passesAA(contrastRatio(fg, bg))).toBe(true);
      }
    });

    it("keeps muted (60%-opacity) text readable on both surfaces", () => {
      const mutedOnPaper = blendOverBackground(eightBit.ink, 0.6, eightBit.paper);
      const mutedOnInk = blendOverBackground(eightBit.paper, 0.6, eightBit.ink);
      expect(passesAA(contrastRatio(mutedOnPaper, eightBit.paper))).toBe(true);
      expect(passesAA(contrastRatio(mutedOnInk, eightBit.ink))).toBe(true);
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
