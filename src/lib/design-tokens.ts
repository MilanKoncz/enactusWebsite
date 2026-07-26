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
} as const;

export type ColorTokenName = keyof typeof colorTokens;
