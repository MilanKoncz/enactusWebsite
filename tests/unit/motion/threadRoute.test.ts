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
      "alumniEmployers",
      "gate-board",
      "board",
      "cta",
    ]);
  });

  it("keeps the three gate-divider stops perfectly vertical at the desktop centre (50)", () => {
    for (const stop of ["gate-kpis", "gate-alumni", "gate-board"] as const) {
      const { from, bow, to } = waypointsFor(stop, "wide");
      expect(from).toBe(50);
      expect(bow).toBe(50);
      expect(to).toBe(50);
    }
  });

  it("keeps the three gate-divider stops perfectly vertical at the mobile axis (8) too", () => {
    for (const stop of ["gate-kpis", "gate-alumni", "gate-board"] as const) {
      const { from, bow, to } = waypointsFor(stop, "narrow");
      expect(from).toBe(8);
      expect(bow).toBe(8);
      expect(to).toBe(8);
    }
  });

  it("pins every mobile stop's from/to to the shared left-edge axis (8)", () => {
    for (const stop of HOME_STOPS) {
      const { from, to } = waypointsFor(stop, "narrow");
      expect(from).toBe(8);
      expect(to).toBe(8);
    }
  });

  it("never bows a mobile stop past the axis into the text column", () => {
    for (const stop of HOME_STOPS) {
      const { bow } = waypointsFor(stop, "narrow");
      expect(bow).toBeLessThanOrEqual(8);
      expect(bow).toBeGreaterThan(0);
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
