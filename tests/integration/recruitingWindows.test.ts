// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const getRecruitingWindows = vi.fn();
const getProjectAreas = vi.fn();

vi.mock("@/lib/recruitingWindows", () => ({
  getRecruitingWindows: (...args: unknown[]) => getRecruitingWindows(...args),
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

describe("GET /api/project-areas", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns the cached active-areas list as-is", async () => {
    const areas = [{ id: "1", labelDe: "SmileGreen", labelEn: "SmileGreen" }];
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
