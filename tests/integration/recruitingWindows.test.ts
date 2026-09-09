// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const getRecruitingWindows = vi.fn();
const getRecruitingWindowsWithInterviewGrid = vi.fn();
const getProjectAreas = vi.fn();

vi.mock("@/lib/recruitingWindows", () => ({
  getRecruitingWindows: (...args: unknown[]) => getRecruitingWindows(...args),
  getRecruitingWindowsWithInterviewGrid: (...args: unknown[]) => getRecruitingWindowsWithInterviewGrid(...args),
}));

vi.mock("@/lib/projectAreas", () => ({
  getProjectAreas: (...args: unknown[]) => getProjectAreas(...args),
}));

describe("GET /api/recruiting-windows", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns the cached window list as-is", async () => {
    const windows = [{ semester: "HWS26", start: "2026-09-01T00:00:00+02:00", end: "2026-09-13T23:59:00+02:00" }];
    getRecruitingWindows.mockResolvedValue(windows);

    const { GET } = await import("@/app/api/recruiting-windows/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ windows });
  });

  it("returns an empty list when the loader falls back to one", async () => {
    getRecruitingWindows.mockResolvedValue([]);

    const { GET } = await import("@/app/api/recruiting-windows/route");
    const response = await GET();

    expect(await response.json()).toEqual({ windows: [] });
  });
});

describe("GET /api/gespraechsslots", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns the cached windows-with-grid list as-is", async () => {
    const windows = [
      {
        semester: "HWS26",
        start: "2026-09-01T00:00:00+02:00",
        end: "2026-09-13T23:59:00+02:00",
        interviewGrid: { days: ["2026-09-15", "2026-09-16"], startTime: "10:00", endTime: "19:00", slotMinutes: 60 },
      },
    ];
    getRecruitingWindowsWithInterviewGrid.mockResolvedValue(windows);

    const { GET } = await import("@/app/api/gespraechsslots/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ windows });
  });

  it("returns an empty list when the loader falls back to one", async () => {
    getRecruitingWindowsWithInterviewGrid.mockResolvedValue([]);

    const { GET } = await import("@/app/api/gespraechsslots/route");
    const response = await GET();

    expect(await response.json()).toEqual({ windows: [] });
  });
});

describe("GET /api/project-areas", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns the cached active-areas list as-is, ideathonHint included", async () => {
    const areas = [{ id: "1", labelDe: "SmileGreen", labelEn: "SmileGreen", ideathonHint: false }];
    getProjectAreas.mockResolvedValue(areas);

    const { GET } = await import("@/app/api/project-areas/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ areas });
  });

  it("returns an empty list when the loader falls back to one", async () => {
    getProjectAreas.mockResolvedValue([]);

    const { GET } = await import("@/app/api/project-areas/route");
    const response = await GET();

    expect(await response.json()).toEqual({ areas: [] });
  });
});
