import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import { collectStrings } from "../../fixtures/collectStrings";

/**
 * This project never uses an em dash or a prose en dash in visitor-facing
 * copy (CLAUDE.md) — a comma, a period, or a second sentence carries the
 * same meaning without it. The one exception is a genuine numeric range
 * ("8–10 Stunden", "3–4 Mitglieder"), where the en dash is the correct
 * character and stays. Walks every string in both message catalogs rather
 * than spot-checking a few keys, the same reasoning
 * tests/unit/contrast.test.ts uses for the calendar color tokens: a drift
 * check catches the next accidental dash a board handover or a copy edit
 * introduces, instead of relying on someone remembering to grep for it.
 */

const EM_DASH = "—";
const EN_DASH = "–";

// A digit-dash-digit run ("8–10") is the one allowed shape for an en dash —
// stripping every such run out first means whatever en dash is left over,
// if any, is never part of a numeric range.
function hasDisallowedDash(value: string): boolean {
  if (value.includes(EM_DASH)) return true;
  const withoutNumericRanges = value.replace(/\d–\d/g, "");
  return withoutNumericRanges.includes(EN_DASH);
}

describe("messages: no em dash or prose en dash in visitor-facing copy", () => {
  it.each([
    ["de", de],
    ["en", en],
  ])("%s.json has no disallowed dash outside a numeric range", (_locale, catalog) => {
    const strings: Array<{ path: string; value: string }> = [];
    collectStrings(catalog, "", strings);

    const offenders = strings.filter(({ value }) => hasDisallowedDash(value));
    expect(offenders.map(({ path, value }) => `${path}: ${value}`)).toEqual([]);
  });
});
