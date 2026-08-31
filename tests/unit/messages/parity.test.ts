import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import { collectStrings } from "../../fixtures/collectStrings";

/**
 * Permanent guard (TASKS.md's Phase 6): every string key that exists in one
 * locale's catalog must exist in the other, so a key added during a copy
 * edit or a board handover can never go untranslated by accident — next-intl
 * falls back to the key path itself at runtime, which is easy to miss on a
 * page nobody's looking at that day. Structure only, not content: this
 * doesn't check that a translation is any good, just that it exists.
 */
function pathsOf(catalog: unknown): string[] {
  const strings: Array<{ path: string; value: string }> = [];
  collectStrings(catalog, "", strings);
  return strings.map(({ path }) => path).sort();
}

describe("messages: de.json and en.json declare the same keys", () => {
  it("has no key present in one locale but missing from the other", () => {
    const dePaths = new Set(pathsOf(de));
    const enPaths = new Set(pathsOf(en));

    const missingInEn = [...dePaths].filter((path) => !enPaths.has(path));
    const missingInDe = [...enPaths].filter((path) => !dePaths.has(path));

    expect(missingInEn, "present in de.json, missing from en.json").toEqual([]);
    expect(missingInDe, "present in en.json, missing from de.json").toEqual([]);
  });
});
