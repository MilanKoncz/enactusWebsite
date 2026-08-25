import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";
import type { CalendarEvent } from "@/content/calendar";

const NOW = new Date("2026-08-17T12:00:00Z");

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c",
    title: "Initiativenmarkt",
    titleEn: null,
    category: "bewerbung",
    startDate: "2026-09-01",
    endDate: null,
    startTime: null,
    endTime: null,
    location: null,
    description: null,
    descriptionEn: null,
    tentative: false,
    internalLink: null,
    ...overrides,
  };
}

// Splits the folded output back into logical (unfolded) lines, the way a
// real ICS reader would — a continuation line starts with a single space,
// which is stripped and joined onto the previous line.
function unfold(ics: string): string[] {
  const physical = ics.split("\r\n").filter((line) => line.length > 0);
  const logical: string[] = [];
  for (const line of physical) {
    if (line.startsWith(" ") && logical.length > 0) {
      logical[logical.length - 1] += line.slice(1);
    } else {
      logical.push(line);
    }
  }
  return logical;
}

describe("buildIcs", () => {
  it("wraps a single VEVENT in a well-formed VCALENDAR", () => {
    const ics = buildIcs(event({}), NOW);
    const lines = unfold(ics);
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("END:VEVENT");
    expect(lines[lines.length - 1]).toBe("END:VCALENDAR");
  });

  it("uses CRLF line endings throughout", () => {
    const ics = buildIcs(event({}), NOW);
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.includes("\n") && !ics.replace(/\r\n/g, "").includes("\n")).toBe(true);
  });

  it("includes a UID built from the event id and the site's own host", () => {
    const lines = unfold(buildIcs(event({}), NOW));
    const uidLine = lines.find((line) => line.startsWith("UID:"))!;
    expect(uidLine).toContain("0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c@");
  });

  it("stamps DTSTAMP in UTC from the given clock", () => {
    const lines = unfold(buildIcs(event({}), NOW));
    expect(lines).toContain("DTSTAMP:20260817T120000Z");
  });

  describe("all-day and multi-day events (no time of day)", () => {
    it("renders a single-day event with an exclusive DTEND one day later", () => {
      const lines = unfold(buildIcs(event({ startDate: "2026-09-01" }), NOW));
      expect(lines).toContain("DTSTART;VALUE=DATE:20260901");
      expect(lines).toContain("DTEND;VALUE=DATE:20260902");
    });

    it("renders a multi-day event ending one day past its actual last day", () => {
      const lines = unfold(
        buildIcs(event({ startDate: "2026-09-15", endDate: "2026-09-16" }), NOW),
      );
      expect(lines).toContain("DTSTART;VALUE=DATE:20260915");
      expect(lines).toContain("DTEND;VALUE=DATE:20260917");
    });

    it("rolls an exclusive end date correctly across a month boundary", () => {
      const lines = unfold(buildIcs(event({ startDate: "2026-09-30" }), NOW));
      expect(lines).toContain("DTEND;VALUE=DATE:20261001");
    });
  });

  describe("timed events — Europe/Berlin to UTC conversion", () => {
    it("converts a summer (CEST, +02:00) start and end time to UTC", () => {
      const lines = unfold(
        buildIcs(
          event({ startDate: "2026-09-07", startTime: "16:00", endTime: "21:00" }),
          NOW,
        ),
      );
      expect(lines).toContain("DTSTART:20260907T140000Z");
      expect(lines).toContain("DTEND:20260907T190000Z");
    });

    it("converts a winter (CET, +01:00) start and end time to UTC", () => {
      const lines = unfold(
        buildIcs(
          event({ startDate: "2027-02-17", startTime: "18:00", endTime: "20:00" }),
          NOW,
        ),
      );
      expect(lines).toContain("DTSTART:20270217T170000Z");
      expect(lines).toContain("DTEND:20270217T190000Z");
    });

    it("defaults to a one-hour duration when no end time is given", () => {
      const lines = unfold(buildIcs(event({ startDate: "2026-09-07", startTime: "16:00" }), NOW));
      expect(lines).toContain("DTSTART:20260907T140000Z");
      expect(lines).toContain("DTEND:20260907T150000Z");
    });

    it("rolls the default one-hour duration into the next UTC day without wrapping the clock", () => {
      // 23:30 Berlin (CEST, +02:00) is 21:30 UTC — a naive "+1 to the hour"
      // wall-clock default would produce the nonsense "24:30"; computing on
      // the absolute instant instead rolls correctly to 22:30 UTC.
      const lines = unfold(buildIcs(event({ startDate: "2026-09-07", startTime: "23:30" }), NOW));
      expect(lines).toContain("DTSTART:20260907T213000Z");
      expect(lines).toContain("DTEND:20260907T223000Z");
    });

    it("uses the end date, not the start date, when a multi-day event has an end time", () => {
      const lines = unfold(
        buildIcs(
          event({
            startDate: "2026-10-02",
            endDate: "2026-10-04",
            startTime: "10:00",
            endTime: "16:00",
          }),
          NOW,
        ),
      );
      expect(lines).toContain("DTSTART:20261002T080000Z");
      expect(lines).toContain("DTEND:20261004T140000Z");
    });
  });

  describe("text escaping", () => {
    it("escapes commas, semicolons, backslashes, and newlines", () => {
      const lines = unfold(
        buildIcs(
          event({
            title: "Kick-off; Teil 1, 2 \\ 3",
            location: "Raum A\nGebäude B",
          }),
          NOW,
        ),
      );
      expect(lines).toContain("SUMMARY:Kick-off\\; Teil 1\\, 2 \\\\ 3");
      expect(lines).toContain("LOCATION:Raum A\\nGebäude B");
    });

    it("includes the description only when one is set", () => {
      const withDescription = unfold(buildIcs(event({ description: "Kurzbeschreibung" }), NOW));
      expect(withDescription.some((line) => line.startsWith("DESCRIPTION:"))).toBe(true);

      const withoutDescription = unfold(buildIcs(event({ description: null }), NOW));
      expect(withoutDescription.some((line) => line.startsWith("DESCRIPTION:"))).toBe(false);
    });
  });

  describe("line folding (RFC 5545 §3.1)", () => {
    it("folds a line longer than 75 octets, with a leading space on the continuation", () => {
      const longLocation = "A".repeat(120);
      const ics = buildIcs(event({ location: longLocation }), NOW);
      const physicalLines = ics.split("\r\n").filter((line) => line.length > 0);
      const locationLines = [];
      let capturing = false;
      for (const line of physicalLines) {
        if (line.startsWith("LOCATION:")) capturing = true;
        else if (capturing && !line.startsWith(" ")) break;
        if (capturing) locationLines.push(line);
      }
      expect(locationLines.length).toBeGreaterThan(1);
      expect(locationLines[1].startsWith(" ")).toBe(true);
      for (const line of physicalLines) {
        expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
      }
    });

    it("reconstructs the exact original value once unfolded", () => {
      const longLocation = "Straße ".repeat(20).trim();
      const lines = unfold(buildIcs(event({ location: longLocation }), NOW));
      expect(lines).toContain(`LOCATION:${longLocation}`);
    });

    it("never splits a multi-byte UTF-8 character across a fold boundary", () => {
      const location = "ü".repeat(80);
      const ics = buildIcs(event({ location }), NOW);
      // If a fold had split a 2-byte UTF-8 character, decoding would throw
      // or produce the replacement character — neither happens here.
      expect(ics).not.toContain("�");
      expect(unfold(ics)).toContain(`LOCATION:${location}`);
    });
  });
});
