// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const findApplicationById = vi.fn();
const fetchCvBlob = vi.fn();

vi.mock("@/lib/db", () => ({
  findApplicationById: (...args: unknown[]) => findApplicationById(...args),
}));

vi.mock("@/lib/cvBlob", () => ({
  fetchCvBlob: (...args: unknown[]) => fetchCvBlob(...args),
}));

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-cv-route-tests";
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function sessionCookie() {
  const { createSessionCookieValue } = await import("@/lib/adminAuth");
  return `admin_session=${createSessionCookieValue()!}`;
}

async function getRequest(withSession = true) {
  const headers: Record<string, string> = {};
  if (withSession) headers.cookie = await sessionCookie();
  return new NextRequest(`http://localhost/api/admin/bewerbungen/${ID}/cv`, { headers });
}

function fakeBlob() {
  return { stream: new ReadableStream(), contentType: "application/pdf" };
}

describe("GET /api/admin/bewerbungen/[id]/cv", () => {
  it("rejects a request with no session without looking anything up", async () => {
    const { GET } = await import("@/app/api/admin/bewerbungen/[id]/cv/route");
    const response = await GET(await getRequest(false), { params: Promise.resolve({ id: ID }) });

    expect(response.status).toBe(401);
    expect(findApplicationById).not.toHaveBeenCalled();
  });

  it("builds the filename from the applicant's name when it survives sanitisation", async () => {
    findApplicationById.mockResolvedValue({
      id: ID,
      firstName: "Jane",
      lastName: "Müller",
      cvPathname: "bewerbungen/abc.pdf",
    });
    fetchCvBlob.mockResolvedValue(fakeBlob());

    const { GET } = await import("@/app/api/admin/bewerbungen/[id]/cv/route");
    const response = await GET(await getRequest(), { params: Promise.resolve({ id: ID }) });

    expect(response.status).toBe(200);
    // filenameSegment drops the umlaut but "Mller" is still non-empty, so
    // the name-based filename is used, exactly as before this fix.
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="Bewerbung-Mller-Jane.pdf"');
  });

  // The regression this closes: a name written entirely in a script outside
  // A-Za-z0-9- (Cyrillic here) sanitises both segments to empty strings —
  // without the fallback this used to produce the literal, collision-prone
  // filename "Bewerbung--.pdf" for every such applicant.
  it("falls back to the application id when the name sanitises to nothing", async () => {
    findApplicationById.mockResolvedValue({
      id: ID,
      firstName: "Иван",
      lastName: "Иванов",
      cvPathname: "bewerbungen/abc.pdf",
    });
    fetchCvBlob.mockResolvedValue(fakeBlob());

    const { GET } = await import("@/app/api/admin/bewerbungen/[id]/cv/route");
    const response = await GET(await getRequest(), { params: Promise.resolve({ id: ID }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(`attachment; filename="Bewerbung-${ID}.pdf"`);
  });

  it("answers 404 without a fallback filename when there is no CV on record", async () => {
    findApplicationById.mockResolvedValue({ id: ID, firstName: "Jane", lastName: "Doe", cvPathname: null });

    const { GET } = await import("@/app/api/admin/bewerbungen/[id]/cv/route");
    const response = await GET(await getRequest(), { params: Promise.resolve({ id: ID }) });

    expect(response.status).toBe(404);
    expect(fetchCvBlob).not.toHaveBeenCalled();
  });
});
