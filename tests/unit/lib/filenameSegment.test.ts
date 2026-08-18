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
});
