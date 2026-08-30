// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const listIdeathonSignups = vi.fn();

vi.mock("@/lib/db", () => ({
  listIdeathonSignups: (...a: unknown[]) => listIdeathonSignups(...a),
}));

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-csv-tests";
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function csvRequest(withSession = true) {
  const headers: Record<string, string> = {};
  if (withSession) {
    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    headers.cookie = `admin_session=${createSessionCookieValue()!}`;
  }
  return new NextRequest("http://localhost/api/admin/ideathon-anmeldungen/csv", { headers });
}

const SIGNUP = {
  id: "1",
  createdAt: new Date("2026-08-25T16:05:52Z"),
  firstName: "Jäne",
  lastName: "Döe",
  email: "jane@example.com",
  studyProgram: "Social Entrepreneurship",
  hasIdea: true,
  registeringAsTeam: true,
  teamSize: 3,
  teamMembers: "Max, Moritz",
  motivationExperience: "Schon mal bei einem Hackathon dabei gewesen.",
  dietaryPreference: "vegetarian" as const,
  mailStatus: "sent" as const,
};

// Closes the gap Phase 1 of the recruiting-release audit found: every other
// admin CSV route (bewerbungen, erinnerungen) had its own test file, this
// one didn't, even though it shipped in the same commit
// (feat(ideathon): add the /ideathon page and signup form) that added those
// siblings' tests. Mirrors adminReminderCsv.test.ts's structure.
describe("GET /api/admin/ideathon-anmeldungen/csv", () => {
  it("rejects a request with no session without reading the database", async () => {
    const { GET } = await import("@/app/api/admin/ideathon-anmeldungen/csv/route");
    const response = await GET(await csvRequest(false));

    expect(response.status).toBe(401);
    expect(listIdeathonSignups).not.toHaveBeenCalled();
  });

  it("writes a UTF-8 BOM so Excel renders umlauts correctly", async () => {
    listIdeathonSignups.mockResolvedValue([SIGNUP]);

    const { GET } = await import("@/app/api/admin/ideathon-anmeldungen/csv/route");
    const response = await GET(await csvRequest());

    expect(response.status).toBe(200);
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("includes the fields specific to the post-0015 form shape", async () => {
    listIdeathonSignups.mockResolvedValue([SIGNUP]);

    const { GET } = await import("@/app/api/admin/ideathon-anmeldungen/csv/route");
    const response = await GET(await csvRequest());
    const body = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await response.arrayBuffer());

    expect(body).toContain("Max, Moritz");
    expect(body).toContain("Schon mal bei einem Hackathon dabei gewesen.");
    expect(body).toContain("vegetarisch");
    expect(body).not.toContain("university");
  });

  it("serves a fixed filename with no interpolated input", async () => {
    listIdeathonSignups.mockResolvedValue([]);

    const { GET } = await import("@/app/api/admin/ideathon-anmeldungen/csv/route");
    const response = await GET(await csvRequest());

    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="ideathon-anmeldungen.csv"',
    );
  });

  it("reports a database failure rather than crashing with an unhandled error", async () => {
    listIdeathonSignups.mockRejectedValue(new Error("db unreachable"));

    const { GET } = await import("@/app/api/admin/ideathon-anmeldungen/csv/route");
    const response = await GET(await csvRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "server_error" });
  });
});
