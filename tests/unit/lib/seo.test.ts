import { afterEach, describe, expect, it, vi } from "vitest";

async function importFresh() {
  vi.resetModules();
  return import("@/lib/seo");
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("pageAlternates", () => {
  it("builds a canonical URL for the requested locale", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { pageAlternates } = await importFresh();
    expect(pageAlternates("/prozess", "de")!.canonical).toBe("https://example.com/prozess");
    expect(pageAlternates("/prozess", "en")!.canonical).toBe("https://example.com/en/prozess");
  });

  it("declares reciprocal de/en hreflang alternates plus an x-default pointing at German", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { pageAlternates } = await importFresh();
    const alternates = pageAlternates("/prozess", "de")!;
    expect(alternates.languages).toEqual({
      de: "https://example.com/prozess",
      en: "https://example.com/en/prozess",
      "x-default": "https://example.com/prozess",
    });
  });

  it("returns the same hreflang languages map regardless of which locale is canonical", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { pageAlternates } = await importFresh();
    expect(pageAlternates("/prozess", "de")!.languages).toEqual(pageAlternates("/prozess", "en")!.languages);
  });

  it("honors the one route whose English slug differs from German (/termine -> /en/calendar)", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { pageAlternates } = await importFresh();
    const alternates = pageAlternates("/termine", "en")!;
    expect(alternates.canonical).toBe("https://example.com/en/calendar");
    expect(alternates.languages?.de).toBe("https://example.com/termine");
  });
});
