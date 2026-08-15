import { describe, expect, it } from "vitest";
import {
  EVENTS_STOPS,
  HOME_STOPS,
  KONTAKT_STOPS,
  PARTNER_STOPS,
  PROCESS_STOPS,
  PROJECTS_STOPS,
  axisFor,
  pathFor,
  waypointsFor,
} from "@/components/motion/threadRoute";

const WIDTHS = ["wide", "narrow"] as const;
const ROUTES = {
  home: HOME_STOPS,
  process: PROCESS_STOPS,
  projects: PROJECTS_STOPS,
  events: EVENTS_STOPS,
  partner: PARTNER_STOPS,
  kontakt: KONTAKT_STOPS,
};
const ALL_STOPS = [
  ...HOME_STOPS,
  ...PROCESS_STOPS,
  ...PROJECTS_STOPS,
  ...EVENTS_STOPS,
  ...PARTNER_STOPS,
  ...KONTAKT_STOPS,
];

describe("threadRoute", () => {
  it("keeps every seam continuous between axis-matching neighbors, in both widths", () => {
    for (const width of WIDTHS) {
      for (const stops of Object.values(ROUTES)) {
        for (let i = 0; i < stops.length - 1; i++) {
          const current = waypointsFor(stops[i], width);
          const next = waypointsFor(stops[i + 1], width);
          if (axisFor(stops[i], width) !== axisFor(stops[i + 1], width)) continue;
          expect(next.from).toBe(current.to);
        }
      }
    }
  });

  it("changes axis at the /prozess timeline stop only: horizontal at wide, vertical at narrow", () => {
    expect(axisFor("process-timeline", "wide")).toBe("x");
    expect(axisFor("process-timeline", "narrow")).toBe("y");
    // Every other stop, in both widths, stays on the default vertical axis —
    // this is a named, single exception, not a silent gap.
    for (const stop of ALL_STOPS) {
      if (stop === "process-timeline") continue;
      for (const width of WIDTHS) {
        expect(axisFor(stop, width)).toBe("y");
      }
    }
  });

  it("keeps the three gate-divider stops perfectly vertical, in both widths", () => {
    for (const stop of ["gate-kpis", "gate-alumni", "gate-board"] as const) {
      for (const width of WIDTHS) {
        const { from, bow, to } = waypointsFor(stop, width);
        expect(from).toBe(50);
        expect(bow).toBe(50);
        expect(to).toBe(50);
      }
    }
  });

  it("produces a well-formed two-segment cubic path for every stop and width", () => {
    const yAxisPattern =
      /^M -?\d+(\.\d+)?,0 C ([\d.-]+,[\d.-]+ ){2}-?\d+(\.\d+)?,50 C ([\d.-]+,[\d.-]+ ){2}-?\d+(\.\d+)?,100$/;
    const xAxisPattern =
      /^M 0,-?\d+(\.\d+)? C ([\d.-]+,[\d.-]+ ){2}50,-?\d+(\.\d+)? C ([\d.-]+,[\d.-]+ ){2}100,-?\d+(\.\d+)?$/;
    for (const stop of ALL_STOPS) {
      for (const width of WIDTHS) {
        const pattern = axisFor(stop, width) === "x" ? xAxisPattern : yAxisPattern;
        expect(pathFor(stop, width)).toMatch(pattern);
      }
    }
  });

  it("stays within the 0-100 coordinate range every waypoint is scaled against", () => {
    for (const stop of ALL_STOPS) {
      for (const width of WIDTHS) {
        const { from, bow, to } = waypointsFor(stop, width);
        for (const value of [from, bow, to]) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
