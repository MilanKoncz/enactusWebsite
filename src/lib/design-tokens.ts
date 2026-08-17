/**
 * Mirrors the `--color-*` values in the `@theme` block of `src/app/globals.css`.
 * Kept in sync by the drift check in `tests/unit/contrast.test.ts` — that test
 * fails if this object and globals.css ever disagree.
 */
export const colorTokens = {
  ink: "#061031",
  gold: "#FFC321",
  paper: "#f3f5f9",
  sand: "#d2bd80",
  oxblood: "#300612",
  moss: "#215c40",
  amber: "#795c13",
} as const;

export type ColorTokenName = keyof typeof colorTokens;

/**
 * The calendar's own color layer — kept as a separate object, not merged
 * into colorTokens above, so the type system carries the same "these are
 * not brand colors" boundary docs/design-system.md draws in prose. Mirrors
 * the `--color-cal-*` tokens in the @theme block of globals.css; kept in
 * sync by the same drift check in tests/unit/contrast.test.ts.
 */
export const calendarColorTokens = {
  "cal-innolab": "#5B3A8C",
  "cal-projekte": "#14625E",
  "cal-journeys": "#1F4F9B",
  "cal-wettkaempfe": "#FFC321",
  "cal-socials": "#A3441E",
  "cal-workshops": "#4A5D23",
  "cal-bewerbung": "#300612",
} as const;

export type CalendarColorTokenName = keyof typeof calendarColorTokens;
