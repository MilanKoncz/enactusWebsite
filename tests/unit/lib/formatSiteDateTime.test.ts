import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatSiteDateTime, siteDateTimeFormatter } from "@/lib/formatSiteDateTime";

// A summer (CEST, +02:00) and a winter (CET, +01:00) instant, each checked
// from a host machine east and west of Berlin. All four combinations must
// render the exact same string — that identity is the whole bug report:
// /mitmachen rendered the window's opening time in the visitor's own zone
// while telling them it was Berlin time.
const SUMMER_INSTANT = "2026-09-13T21:59:00.000Z"; // 13.09.2026, 23:59 CEST
const WINTER_INSTANT = "2027-01-15T11:00:00.000Z"; // 15.01.2027, 12:00 CET

const HOST_TIMEZONES = ["Asia/Seoul", "America/New_York"];

const originalTz = process.env.TZ;

describe("formatSiteDateTime", () => {
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("renders identically regardless of the host machine's own timezone (summer)", () => {
    const outputs = HOST_TIMEZONES.map((tz) => {
      process.env.TZ = tz;
      return formatSiteDateTime(SUMMER_INSTANT, "de-DE", { dateStyle: "long", timeStyle: "short" });
    });
    expect(new Set(outputs).size).toBe(1);
    expect(outputs[0]).toBe("13. September 2026 um 23:59");
  });

  it("renders identically regardless of the host machine's own timezone (winter)", () => {
    const outputs = HOST_TIMEZONES.map((tz) => {
      process.env.TZ = tz;
      return formatSiteDateTime(WINTER_INSTANT, "de-DE", { dateStyle: "long", timeStyle: "short" });
    });
    expect(new Set(outputs).size).toBe(1);
    expect(outputs[0]).toBe("15. Januar 2027 um 12:00");
  });

  it("accepts a Date instance as well as an ISO string", () => {
    expect(formatSiteDateTime(new Date(SUMMER_INSTANT), "de-DE", { dateStyle: "long", timeStyle: "short" })).toBe(
      formatSiteDateTime(SUMMER_INSTANT, "de-DE", { dateStyle: "long", timeStyle: "short" }),
    );
  });

  it("cannot be overridden with a different timeZone via options", () => {
    // Intl.DateTimeFormatOptions happens to allow `timeZone`, so nothing at
    // the type level stops a caller from passing one — this proves the
    // runtime behaviour still wins: SITE_TIMEZONE is applied last.
    const result = formatSiteDateTime(SUMMER_INSTANT, "de-DE", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "UTC",
    });
    expect(result).toBe("13. September 2026 um 23:59");
  });
});

describe("siteDateTimeFormatter", () => {
  beforeEach(() => {
    process.env.TZ = "Asia/Seoul";
  });

  it("resolves to Europe/Berlin regardless of the host timezone", () => {
    const formatter = siteDateTimeFormatter("de-DE", { dateStyle: "medium", timeStyle: "short" });
    expect(formatter.resolvedOptions().timeZone).toBe("Europe/Berlin");
  });

  it("can format many values with one instance, for a table of rows", () => {
    const formatter = siteDateTimeFormatter("de-DE", { dateStyle: "medium", timeStyle: "short" });
    expect(formatter.format(new Date(SUMMER_INSTANT))).toBe("13.09.2026, 23:59");
    expect(formatter.format(new Date(WINTER_INSTANT))).toBe("15.01.2027, 12:00");
  });
});
