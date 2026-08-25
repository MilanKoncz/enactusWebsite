// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const findCalendarEventById = vi.fn();

vi.mock("@/lib/db", () => ({
  findCalendarEventById: (...args: unknown[]) => findCalendarEventById(...args),
}));

const EVENT = {
  id: "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c",
  title: "Ideathon",
  titleEn: null,
  category: "innolab",
  startDate: "2026-09-24",
  endDate: "2026-09-27",
  startTime: null,
  endTime: null,
  location: null,
  description: null,
  descriptionEn: null,
  tentative: false,
  internalLink: null,
};

function request(url: string) {
  return new NextRequest(url);
}

describe("GET /api/kalender/[id]/ics", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects a malformed id before querying the database", async () => {
    const { GET } = await import("@/app/api/kalender/[id]/ics/route");
    const response = await GET(request("http://localhost/api/kalender/not-a-uuid/ics"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(response.status).toBe(400);
    expect(findCalendarEventById).not.toHaveBeenCalled();
  });

  it("answers 404 for an id that doesn't exist", async () => {
    findCalendarEventById.mockResolvedValue(null);
    const { GET } = await import("@/app/api/kalender/[id]/ics/route");
    const response = await GET(request(`http://localhost/api/kalender/${EVENT.id}/ics`), {
      params: Promise.resolve({ id: EVENT.id }),
    });

    expect(response.status).toBe(404);
  });

  it("answers 500 without leaking the driver error when the database fails", async () => {
    findCalendarEventById.mockRejectedValue(new Error("connection refused"));
    const { GET } = await import("@/app/api/kalender/[id]/ics/route");
    const response = await GET(request(`http://localhost/api/kalender/${EVENT.id}/ics`), {
      params: Promise.resolve({ id: EVENT.id }),
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ ok: false, error: "server_error" });
  });

  it("returns a downloadable ics file with the correct headers and content, requiring no session", async () => {
    findCalendarEventById.mockResolvedValue(EVENT);
    const { GET } = await import("@/app/api/kalender/[id]/ics/route");
    const response = await GET(request(`http://localhost/api/kalender/${EVENT.id}/ics`), {
      params: Promise.resolve({ id: EVENT.id }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="Ideathon.ics"');

    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("SUMMARY:Ideathon");
    expect(body).toContain("DTSTART;VALUE=DATE:20260924");
    expect(body).toContain("DTEND;VALUE=DATE:20260928");
  });

  it("falls back to the event id for the filename when the title sanitises to nothing", async () => {
    findCalendarEventById.mockResolvedValue({ ...EVENT, title: "äöü" });
    const { GET } = await import("@/app/api/kalender/[id]/ics/route");
    const response = await GET(request(`http://localhost/api/kalender/${EVENT.id}/ics`), {
      params: Promise.resolve({ id: EVENT.id }),
    });

    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="${EVENT.id}.ics"`);
  });
});
