// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const listApplicationsBySemester = vi.fn();
const listRecruitingWindows = vi.fn();

vi.mock("@/lib/db", () => ({
  listApplicationsBySemester: (...a: unknown[]) => listApplicationsBySemester(...a),
  listRecruitingWindows: (...a: unknown[]) => listRecruitingWindows(...a),
}));

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

const WINDOW = {
  id: "w1",
  semester: "HWS26",
  start: "2026-08-31T22:00:00.000Z",
  end: "2026-09-13T21:59:00.000Z",
  createdAt: new Date("2026-08-15T00:00:00Z"),
  interviewDays: ["2026-09-15"],
  interviewStartTime: "10:00",
  interviewEndTime: "12:00",
  interviewSlotMinutes: 60,
};
// Generates two slots: 08:00Z (10:00 Berlin) and 09:00Z (11:00 Berlin).

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-csv-tests";
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function csvRequest(semester: string | null = "HWS26", withSession = true) {
  const headers: Record<string, string> = {};
  if (withSession) {
    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    headers.cookie = `admin_session=${createSessionCookieValue()!}`;
  }
  const url = semester
    ? `http://localhost/api/admin/gespraechsplanung/csv?semester=${semester}`
    : "http://localhost/api/admin/gespraechsplanung/csv";
  return new NextRequest(url, { headers });
}

describe("GET /api/admin/gespraechsplanung/csv", () => {
  it("rejects a request with no session without reading the database", async () => {
    const { GET } = await import("@/app/api/admin/gespraechsplanung/csv/route");
    const response = await GET(await csvRequest("HWS26", false));

    expect(response.status).toBe(401);
    expect(listApplicationsBySemester).not.toHaveBeenCalled();
  });

  it("rejects a request with no semester", async () => {
    const { GET } = await import("@/app/api/admin/gespraechsplanung/csv/route");
    const response = await GET(await csvRequest(null));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "missing_semester" });
  });

  it("writes a UTF-8 BOM so Excel renders umlauts correctly", async () => {
    listApplicationsBySemester.mockResolvedValue([]);
    listRecruitingWindows.mockResolvedValue([WINDOW]);

    const { GET } = await import("@/app/api/admin/gespraechsplanung/csv/route");
    const response = await GET(await csvRequest());

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("labels each row's answer state and marks a checked slot", async () => {
    listApplicationsBySemester.mockResolvedValue([
      { id: "1", firstName: "Anna", lastName: "Berger", interviewSlots: ["2026-09-15T08:00:00.000Z"] },
      { id: "2", firstName: "Ben", lastName: "Cakir", interviewSlots: [] },
      { id: "3", firstName: "Clara", lastName: "Doerr", interviewSlots: null },
    ]);
    listRecruitingWindows.mockResolvedValue([WINDOW]);

    const { GET } = await import("@/app/api/admin/gespraechsplanung/csv/route");
    const response = await GET(await csvRequest());
    const body = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await response.arrayBuffer());

    expect(body).toContain("Anna Berger,ja,x,");
    expect(body).toContain("Ben Cakir,nichts gewählt,,");
    expect(body).toContain("Clara Doerr,keine Angabe,,");
  });

  it("marks a column no longer part of the configured grid", async () => {
    listApplicationsBySemester.mockResolvedValue([
      { id: "1", firstName: "Anna", lastName: "Berger", interviewSlots: ["2099-01-01T08:00:00.000Z"] },
    ]);
    listRecruitingWindows.mockResolvedValue([WINDOW]);

    const { GET } = await import("@/app/api/admin/gespraechsplanung/csv/route");
    const response = await GET(await csvRequest());
    const body = await response.text();

    expect(body).toContain("(entfallen)");
  });

  it("serves a semester-scoped filename", async () => {
    listApplicationsBySemester.mockResolvedValue([]);
    listRecruitingWindows.mockResolvedValue([WINDOW]);

    const { GET } = await import("@/app/api/admin/gespraechsplanung/csv/route");
    const response = await GET(await csvRequest());

    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="gespraechsplanung-HWS26.csv"',
    );
  });

  it("reports a database failure rather than crashing with an unhandled error", async () => {
    listApplicationsBySemester.mockRejectedValue(new Error("db unreachable"));
    listRecruitingWindows.mockResolvedValue([WINDOW]);

    const { GET } = await import("@/app/api/admin/gespraechsplanung/csv/route");
    const response = await GET(await csvRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "server_error" });
  });
});
