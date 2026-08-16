import { describe, expect, it } from "vitest";
import { HOME_STOPS, pathFor, waypointsFor } from "@/components/motion/threadRoute";

const WIDTHS = ["wide", "narrow"] as const;

describe("threadRoute", () => {
  it("keeps every seam continuous between neighbouring stops, in both widths", () => {
    for (const width of WIDTHS) {
      for (let i = 0; i < HOME_STOPS.length - 1; i++) {
        const current = waypointsFor(HOME_STOPS[i], width);
        const next = waypointsFor(HOME_STOPS[i + 1], width);
        expect(next.from).toBe(current.to);
      }
    }
  });

  it("runs on the homepage only", () => {
    expect(HOME_STOPS).toEqual([
      "partners",
      "gate-kpis",
      "kpis",
      "pillars",
      "benefits",
      "gate-alumni",
      "alumni",
      "gate-board",
      "board",
      "cta",
    ]);
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
    const pattern =
      /^M -?\d+(\.\d+)?,0 C ([\d.-]+,[\d.-]+ ){2}-?\d+(\.\d+)?,50 C ([\d.-]+,[\d.-]+ ){2}-?\d+(\.\d+)?,100$/;
    for (const stop of HOME_STOPS) {
      for (const width of WIDTHS) {
        expect(pathFor(stop, width)).toMatch(pattern);
      }
    }
  });

  it("stays within the 0-100 coordinate range every waypoint is scaled against", () => {
    for (const stop of HOME_STOPS) {
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
