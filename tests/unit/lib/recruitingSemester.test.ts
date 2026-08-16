import { describe, expect, it } from "vitest";
import { deriveSemesterLabel, resolveApplicationSemester } from "@/lib/recruitingSemester";
import { recruitingWindows } from "@/content/recruiting";

describe("deriveSemesterLabel", () => {
  it("labels März through September as HWS of the current year", () => {
    expect(deriveSemesterLabel(new Date("2026-03-01T00:00:00Z"))).toBe("HWS26");
    expect(deriveSemesterLabel(new Date("2026-09-30T23:59:00Z"))).toBe("HWS26");
  });

  it("labels Oktober through Dezember as FSS of the following year", () => {
    expect(deriveSemesterLabel(new Date("2026-10-01T00:00:00Z"))).toBe("FSS27");
    expect(deriveSemesterLabel(new Date("2026-12-31T23:59:00Z"))).toBe("FSS27");
  });

  it("labels Januar and Februar as FSS of the same year", () => {
    expect(deriveSemesterLabel(new Date("2027-01-01T00:00:00Z"))).toBe("FSS27");
    expect(deriveSemesterLabel(new Date("2027-02-28T23:59:00Z"))).toBe("FSS27");
  });
});

describe("resolveApplicationSemester", () => {
  it("uses the matching window's label when the date falls inside it", () => {
    const [hws26] = recruitingWindows;
    const inside = new Date(hws26.start);
    expect(resolveApplicationSemester(inside)).toBe(hws26.semester);
  });

  it("falls back to the derived label when the date matches no window", () => {
    expect(resolveApplicationSemester(new Date("2026-06-01T00:00:00Z"))).toBe("HWS26");
    expect(resolveApplicationSemester(new Date("2027-01-15T00:00:00Z"))).toBe("FSS27");
  });
});
