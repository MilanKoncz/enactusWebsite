import { describe, expect, it } from "vitest";
import { filenameSegment } from "@/lib/filenameSegment";

describe("filenameSegment", () => {
  it("keeps a normal semester label as-is", () => {
    expect(filenameSegment("HWS26")).toBe("HWS26");
  });

  it("strips quotes and separators that would break the Content-Disposition header", () => {
    expect(filenameSegment('HWS26"; rm -rf /')).toBe("HWS26rm-rf");
  });

  it("strips CR and LF so a header can never be split", () => {
    expect(filenameSegment("HWS26\r\nX-Injected: 1")).toBe("HWS26X-Injected1");
  });

  it("keeps an umlaut-free event title readable, dropping spaces and punctuation", () => {
    expect(filenameSegment("Q-Summit 2026!")).toBe("Q-Summit2026");
  });

  it("drops umlauts and other non-ASCII characters rather than mangling them", () => {
    expect(filenameSegment("Bewerbungsgespräche")).toBe("Bewerbungsgesprche");
  });

  // A name written entirely in a script outside A-Za-z0-9- (Cyrillic, CJK,
  // Arabic, ...) sanitises to nothing at all — not a mangled-but-readable
  // fallback like the umlaut case above. Every call site that builds a
  // filename from user-entered text (the CV download route, the ICS route)
  // must guard this case itself; filenameSegment deliberately doesn't paper
  // over it with an invented fallback, since it has no non-empty value to
  // fall back to.
  it("returns an empty string for a name with no character in A-Za-z0-9-", () => {
    expect(filenameSegment("李")).toBe("");
    expect(filenameSegment("Иванов")).toBe("");
    expect(filenameSegment("محمد")).toBe("");
  });

  it("returns an empty string for an already-empty input", () => {
    expect(filenameSegment("")).toBe("");
  });
});
