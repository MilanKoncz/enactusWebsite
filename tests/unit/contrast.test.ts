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
  // Redone a fourth time 2026-08-20: the plateau-to-100% ramp was a plain
  // two-stop linear blend meeting the flat plateau's zero slope head-on at
  // the boundary — a real kink in the rate of color change, which read as
  // "a hard cut" rather than a gradient (board feedback). Pulling the
  // plateau back (46/58 -> 28/40) keeps the same plain two-stop shape (no
  // color-mix(), no third literal color — see the utility's own comment in
  // globals.css for why a third color was ruled out) but stretches it over
  // a longer run, which changes color more slowly per pixel and reads as
  // soft and gradual instead of an edge.
  describe(".signature-gradient: weighted ink-to-gold, real tokens, no color-mix()", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
    const declaration = css.match(/@utility signature-gradient \{[\s\S]*?\n\}/)?.[0] ?? "";

    it("is vertical (top to bottom) with a 28% plateau below md, and horizontal (to right) with a 40% plateau from md up, both ending at --color-gold, no color-mix()", () => {
      expect(declaration).toContain("to bottom");
      expect(declaration).toContain("var(--color-ink) 28%");
      expect(declaration).toContain("@media (min-width: 48rem)");
      expect(declaration).toContain("to right");
      expect(declaration).toContain("var(--color-ink) 40%");
      expect(declaration).toContain("var(--color-gold) 100%");
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

    // The color the gradient actually paints at a given % along its axis
    // (width for the horizontal md+ ramp, height for the vertical
    // below-md ramp), replicating the flat-then-ramp CSS above in plain JS.
    function gradientColorAt(pct: number, plateau: number): string {
      if (pct <= plateau) return ink;
      const t = (pct - plateau) / (100 - plateau);
      const a = hexToRgb(ink);
      const b = hexToRgb(gold);
      const mixed = a.map((v, i) => v + (b[i] - v) * t);
      return `#${mixed.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
    }

    // The 7-point sweep this file's own history refers to — every point is
    // checked below for both the heading/body category (full-opacity
    // paper — a heading and its lead paragraph are the same color against
    // the same background pixel, so one figure covers both) and the
    // eyebrow category (opacity-60 paper), at both the vertical (below md)
    // and horizontal (md+) plateau.
    const SAMPLE_POINTS = [0, 16.67, 33.33, 50, 66.67, 83.33, 100];
    const H_PLATEAU = 40;
    const V_PLATEAU = 28;

    // Real max right edge of JourneysSection's lead paragraph at md and up
    // — its max-w-lg wrapper, self-start, is the widest bounded text either
    // consumer puts directly on the gradient — measured with Playwright:
    // 69.8% at 768px, 43.1% at 1280px (both use the horizontal 40% plateau,
    // the same measurement that stood against the earlier 58% plateau —
    // pulling the plateau back doesn't move where the text itself sits).
    const REAL_TEXT_RIGHT_EDGES: Array<{ label: string; pct: number; plateau: number }> = [
      { label: "768px heading/lead right edge", pct: 69.8, plateau: H_PLATEAU },
      { label: "1280px heading/lead right edge", pct: 43.1, plateau: H_PLATEAU },
    ];

    it.each(REAL_TEXT_RIGHT_EDGES)(
      "from md up, full-opacity paper heading/lead text clears 4.5:1 at its real measured right edge ($label)",
      ({ pct, plateau }) => {
        const bg = gradientColorAt(pct, plateau);
        expect(passesAA(contrastRatio(paper, bg))).toBe(true);
      },
    );

    // Below md, real bottom edge of each consumer's text block — measured
    // with Playwright, identically at 360px and 390px in both cases.
    // JourneysSection's heading+lead group is the taller of the two and, at
    // the pulled-back 28% plateau, now sits past it on the ramp itself —
    // unlike the horizontal axis's real edges, which still land inside the
    // 40% plateau. Safety here comes from the ramp's own contrast headroom
    // (verified below), the same way the horizontal axis always worked,
    // not from a "still pure ink" guarantee.
    const REAL_TEXT_BOTTOM_EDGES: Array<{ label: string; pct: number }> = [
      { label: "JourneysSection heading+lead block bottom", pct: 41.2 },
      { label: "ProjectsActive label bottom", pct: 8.7 },
    ];

    it.each(REAL_TEXT_BOTTOM_EDGES)(
      "below md, full-opacity paper text clears 4.5:1 at its real measured bottom edge ($label)",
      ({ pct }) => {
        const bg = gradientColorAt(pct, V_PLATEAU);
        expect(passesAA(contrastRatio(paper, bg))).toBe(true);
      },
    );

    it("ProjectsActive's label, well above the 28% plateau, still sits on pure ink", () => {
      expect(gradientColorAt(8.7, V_PLATEAU)).toBe(ink);
    });

    // Each axis keeps a safety buffer past its own real text edges above —
    // not the same round number for both, since the two axes' real edges
    // sit at very different points (max 69.8% horizontal, max 41.2%
    // vertical). Past its buffer, a sample point is the gradient's pure
    // decorative tail, always covered by the two sections' opaque
    // ink-fill/gold-edge cards (JourneysSection.tsx / ProjectsActive.tsx),
    // never by raw text.
    const AXES: Array<{ label: string; plateau: number; safeUpToPct: number }> = [
      { label: "horizontal (md+)", plateau: H_PLATEAU, safeUpToPct: 70 },
      { label: "vertical (below md)", plateau: V_PLATEAU, safeUpToPct: 50 },
    ];

    it.each(AXES)(
      "paper heading/lead text clears 4.5:1 at every sample point up to the $label axis's text-safe boundary",
      ({ plateau, safeUpToPct }) => {
        const textSafePoints = SAMPLE_POINTS.filter((p) => p <= safeUpToPct);
        for (const pct of textSafePoints) {
          const bg = gradientColorAt(pct, plateau);
          expect(passesAA(contrastRatio(paper, bg))).toBe(true);
        }
      },
    );

    it("the gradient's pure-gold tail (83.33%/100%, both axes) does fail paper-text contrast — by design, always covered by an opaque card, never by raw text", () => {
      for (const { plateau } of AXES) {
        expect(passesAA(contrastRatio(paper, gradientColorAt(83.33, plateau)))).toBe(false);
        expect(passesAA(contrastRatio(paper, gradientColorAt(100, plateau)))).toBe(false);
      }
    });

    it("Eyebrow's opacity-60 treatment clears 4.5:1 anywhere the eyebrow itself can render (it's a short, top-anchored line, always inside the flat plateau)", () => {
      for (const { plateau } of AXES) {
        const bg = gradientColorAt(0, plateau);
        const muted = blendOverBackground(paper, 0.6, bg);
        expect(passesAA(contrastRatio(muted, bg))).toBe(true);
      }
    });

    // The full 7-point sweep, both categories, both axes — the numbers
    // this file's own history and globals.css's comment quote directly.
    it.each(AXES)(
      "records the full 7-point contrast sweep for heading/body and eyebrow text on the $label axis",
      ({ plateau }) => {
        for (const pct of SAMPLE_POINTS) {
          const bg = gradientColorAt(pct, plateau);
          const headingBodyRatio = contrastRatio(paper, bg);
          const eyebrowColor = blendOverBackground(paper, 0.6, bg);
          const eyebrowRatio = contrastRatio(eyebrowColor, bg);
          // Every point up to 100% is a real, finite ratio — this test's
          // job is to force the numbers to exist and be inspectable (e.g.
          // via --reporter=verbose), not to assert AA everywhere: the
          // decorative tail past each axis's safe boundary is expected to
          // fail, covered by an opaque card, asserted separately above.
          expect(headingBodyRatio).toBeGreaterThan(1);
          expect(eyebrowRatio).toBeGreaterThan(1);
        }
      },
    );
  });

  // Easter egg 3/3 (docs/eastereggs.md): html[data-eight-bit="active"]'s
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
