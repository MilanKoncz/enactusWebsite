// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const listReminderSignups = vi.fn();

vi.mock("@/lib/db", () => ({
  listReminderSignups: (...a: unknown[]) => listReminderSignups(...a),
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
  return new NextRequest("http://localhost/api/admin/erinnerungen/csv", { headers });
}

const CONFIRMED = {
  id: "1",
  createdAt: new Date("2026-08-01T10:00:00Z"),
  email: "jäne@example.com",
  confirmed: true,
  confirmedAt: new Date("2026-08-01T10:05:00Z"),
  unsubscribedAt: null,
  mailStatus: "sent" as const,
};

describe("GET /api/admin/erinnerungen/csv", () => {
  it("rejects a request with no session without reading the database", async () => {
    const { GET } = await import("@/app/api/admin/erinnerungen/csv/route");
    const response = await GET(await csvRequest(false));

    expect(response.status).toBe(401);
    expect(listReminderSignups).not.toHaveBeenCalled();
  });

  it("writes a UTF-8 BOM so Excel renders umlauts correctly", async () => {
    listReminderSignups.mockResolvedValue([CONFIRMED]);

    const { GET } = await import("@/app/api/admin/erinnerungen/csv/route");
    const response = await GET(await csvRequest());

    expect(response.status).toBe(200);
    // response.text() strips a leading BOM by spec, so this reads the raw
    // bytes — same reasoning as the applications CSV test.
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("labels each row with the state the board reads, not the raw columns", async () => {
    listReminderSignups.mockResolvedValue([
      CONFIRMED,
      { ...CONFIRMED, id: "2", email: "b@example.com", confirmed: false, confirmedAt: null },
      {
        ...CONFIRMED,
        id: "3",
        email: "c@example.com",
        unsubscribedAt: new Date("2026-08-02T10:00:00Z"),
      },
    ]);

    const { GET } = await import("@/app/api/admin/erinnerungen/csv/route");
    const response = await GET(await csvRequest());
    const body = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await response.arrayBuffer());

    expect(body).toContain("jäne@example.com,bestätigt");
    expect(body).toContain("b@example.com,unbestätigt");
    expect(body).toContain("c@example.com,abgemeldet");
  });

  // The export gets forwarded around; a live confirm or unsubscribe link
  // for someone else's address must never travel with it.
  it("never includes the confirm or unsubscribe tokens", async () => {
    listReminderSignups.mockResolvedValue([CONFIRMED]);

    const { GET } = await import("@/app/api/admin/erinnerungen/csv/route");
    const response = await GET(await csvRequest());
    const body = await response.text();

    expect(body).not.toContain("token");
    expect(body.toLowerCase()).not.toContain("bestaetigen?");
    expect(body.toLowerCase()).not.toContain("abmelden?");
  });

  it("serves a fixed filename with no interpolated input", async () => {
    listReminderSignups.mockResolvedValue([]);

    const { GET } = await import("@/app/api/admin/erinnerungen/csv/route");
    const response = await GET(await csvRequest());

    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="erinnerungsliste.csv"',
    );
  });

  it("reports a database failure rather than crashing with an unhandled error", async () => {
    listReminderSignups.mockRejectedValue(new Error("db unreachable"));

    const { GET } = await import("@/app/api/admin/erinnerungen/csv/route");
    const response = await GET(await csvRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "server_error" });
  });
});
