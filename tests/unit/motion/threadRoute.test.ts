import { describe, expect, it } from "vitest";
import { THREAD_STOPS, pathFor, waypointsFor } from "@/components/motion/threadRoute";

const WIDTHS = ["wide", "narrow"] as const;

describe("threadRoute", () => {
  it("keeps every seam continuous: a stop's `to` matches the next stop's `from`, in both widths", () => {
    for (const width of WIDTHS) {
      for (let i = 0; i < THREAD_STOPS.length - 1; i++) {
        const current = waypointsFor(THREAD_STOPS[i], width);
        const next = waypointsFor(THREAD_STOPS[i + 1], width);
        expect(next.from).toBe(current.to);
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
    const pathPattern =
      /^M -?\d+(\.\d+)?,0 C ([\d.-]+,[\d.-]+ ){2}-?\d+(\.\d+)?,50 C ([\d.-]+,[\d.-]+ ){2}-?\d+(\.\d+)?,100$/;
    for (const stop of THREAD_STOPS) {
      for (const width of WIDTHS) {
        expect(pathFor(stop, width)).toMatch(pathPattern);
      }
    }
  });

  it("stays within the 0-100 coordinate range every waypoint is scaled against", () => {
    for (const stop of THREAD_STOPS) {
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
