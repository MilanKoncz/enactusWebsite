import { describe, expect, it } from "vitest";
import { recruitingPhaseAt, currentOrNextRecruitingWindow } from "@/lib/recruitingStatus";
import type { RecruitingWindow } from "@/content/recruiting";

const hws26: RecruitingWindow = {
  semester: "HWS26",
  start: "2026-09-01T00:00:00+02:00",
  end: "2026-09-13T23:59:00+02:00",
};
const startMs = new Date(hws26.start).getTime();
const endMs = new Date(hws26.end).getTime();

describe("recruitingPhaseAt", () => {
  it("is 'unscheduled' when there are no windows at all", () => {
    expect(recruitingPhaseAt(0, [])).toBe("unscheduled");
  });

  it("is 'before' any moment ahead of the opening time", () => {
    expect(recruitingPhaseAt(startMs - 1, [hws26])).toBe("before");
    expect(recruitingPhaseAt(0, [hws26])).toBe("before");
  });

  it("is 'open' at the exact opening moment and anywhere inside the window", () => {
    expect(recruitingPhaseAt(startMs, [hws26])).toBe("open");
    expect(recruitingPhaseAt((startMs + endMs) / 2, [hws26])).toBe("open");
  });

  it("is 'open' at the exact closing moment", () => {
    expect(recruitingPhaseAt(endMs, [hws26])).toBe("open");
  });

  it("is 'after' once the closing moment has passed and no future window exists", () => {
    expect(recruitingPhaseAt(endMs + 1, [hws26])).toBe("after");
  });
});

describe("currentOrNextRecruitingWindow", () => {
  it("returns the window containing 'now'", () => {
    expect(currentOrNextRecruitingWindow(startMs, [hws26])).toEqual(hws26);
    expect(currentOrNextRecruitingWindow(endMs, [hws26])).toEqual(hws26);
  });

  it("returns the soonest future window before it opens", () => {
    expect(currentOrNextRecruitingWindow(startMs - 1, [hws26])).toEqual(hws26);
  });

  it("returns null once every known window has closed", () => {
    expect(currentOrNextRecruitingWindow(endMs + 1, [hws26])).toBeNull();
  });

  it("returns null when there are no windows at all", () => {
    expect(currentOrNextRecruitingWindow(0, [])).toBeNull();
  });

  it("picks the soonest of several future windows, regardless of list order", () => {
    const later = { semester: "FSS27", start: "2027-03-01T00:00:00+01:00", end: "2027-03-14T23:59:00+01:00" };
    const earlier = { semester: "HWS26", start: "2026-09-01T00:00:00+02:00", end: "2026-09-13T23:59:00+02:00" };
    const beforeEarlier = new Date(earlier.start).getTime() - 1000;

    expect(currentOrNextRecruitingWindow(beforeEarlier, [later, earlier])).toEqual(earlier);
  });

  it("returns the window containing 'now' even when a later window also exists", () => {
    const current = { semester: "HWS26", start: "2026-09-01T00:00:00+02:00", end: "2026-09-13T23:59:00+02:00" };
    const future = { semester: "FSS27", start: "2027-03-01T00:00:00+01:00", end: "2027-03-14T23:59:00+01:00" };
    const insideCurrent = new Date(current.start).getTime() + 1000;

    expect(currentOrNextRecruitingWindow(insideCurrent, [current, future])).toEqual(current);
  });
});
