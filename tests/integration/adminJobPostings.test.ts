// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertJobPosting = vi.fn();
const updateJobPosting = vi.fn();
const deleteJobPosting = vi.fn();
const revalidateTag = vi.fn();

vi.mock("@/lib/db", () => ({
  insertJobPosting: (...args: unknown[]) => insertJobPosting(...args),
  updateJobPosting: (...args: unknown[]) => updateJobPosting(...args),
  deleteJobPosting: (...args: unknown[]) => deleteJobPosting(...args),
}));

// Partial, not a replacement: lib/jobPostings.ts is imported transitively
// for its tag constants and calls unstable_cache at module scope, so
// stubbing the whole module breaks the import rather than the call under
// test — same reasoning as adminCalendarEvents.test.ts.
vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return { ...actual, revalidateTag: (...a: unknown[]) => revalidateTag(...a) };
});

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

const VALID = {
  company: "SZA",
  title: "Werkstudent Consulting",
  employmentType: "werkstudent",
  remote: "hybrid",
  applyUrl: "https://example.com/jobs/1",
  expiresAt: isoDate(30),
};

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-job-posting-tests";
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

async function request(method: string, url: string, body?: unknown, withSession = true) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withSession) headers.cookie = await sessionCookie();
  return new NextRequest(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

describe("POST /api/admin/jobs", () => {
  it("rejects a request with no session without writing anything", async () => {
    const { POST } = await import("@/app/api/admin/jobs/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/jobs", VALID, false));

    expect(response.status).toBe(401);
    expect(insertJobPosting).not.toHaveBeenCalled();
  });

  it("rejects a blank company", async () => {
    const { POST } = await import("@/app/api/admin/jobs/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/jobs", { ...VALID, company: "  " }));

    expect(response.status).toBe(400);
    expect(insertJobPosting).not.toHaveBeenCalled();
  });

  it("rejects a non-https apply URL", async () => {
    const { POST } = await import("@/app/api/admin/jobs/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/jobs", { ...VALID, applyUrl: "http://example.com/jobs/1" }),
    );

    expect(response.status).toBe(400);
    expect(insertJobPosting).not.toHaveBeenCalled();
  });

  it("rejects an expiry date in the past", async () => {
    const { POST } = await import("@/app/api/admin/jobs/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/jobs", { ...VALID, expiresAt: isoDate(-5) }),
    );

    expect(response.status).toBe(400);
    expect(insertJobPosting).not.toHaveBeenCalled();
  });

  it("creates the posting and invalidates the jobs cache", async () => {
    insertJobPosting.mockResolvedValue({ id: ID, ...VALID });
    const { POST } = await import("@/app/api/admin/jobs/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/jobs", VALID));

    expect(response.status).toBe(201);
    expect(revalidateTag).toHaveBeenCalledWith("job-postings", { expire: 0 });
  });

  it("answers 500 without invalidating the cache when the database write fails", async () => {
    insertJobPosting.mockRejectedValue(new Error("connection refused"));
    const { POST } = await import("@/app/api/admin/jobs/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/jobs", VALID));

    expect(response.status).toBe(500);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/jobs/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session", async () => {
    const { PATCH } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await PATCH(await request("PATCH", `http://localhost/api/admin/jobs/${ID}`, VALID, false), {
      params: params(),
    });

    expect(response.status).toBe(401);
    expect(updateJobPosting).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before validating the body", async () => {
    const { PATCH } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await PATCH(await request("PATCH", "http://localhost/api/admin/jobs/nope", VALID), {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(response.status).toBe(400);
    expect(updateJobPosting).not.toHaveBeenCalled();
  });

  it("allows an expiry date in the past when editing (the create-only restriction doesn't apply)", async () => {
    updateJobPosting.mockResolvedValue({ id: ID, ...VALID, expiresAt: isoDate(-10) });
    const { PATCH } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/jobs/${ID}`, { ...VALID, expiresAt: isoDate(-10) }),
      { params: params() },
    );

    expect(response.status).toBe(200);
    expect(updateJobPosting).toHaveBeenCalled();
  });

  it("answers 404 when the posting is already gone, without invalidating the cache", async () => {
    updateJobPosting.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await PATCH(await request("PATCH", `http://localhost/api/admin/jobs/${ID}`, VALID), {
      params: params(),
    });

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("updates the posting and invalidates the jobs cache", async () => {
    updateJobPosting.mockResolvedValue({ id: ID, ...VALID });
    const { PATCH } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await PATCH(await request("PATCH", `http://localhost/api/admin/jobs/${ID}`, VALID), {
      params: params(),
    });

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("job-postings", { expire: 0 });
  });
});

describe("DELETE /api/admin/jobs/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session without deleting anything", async () => {
    const { DELETE } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await DELETE(await request("DELETE", `http://localhost/api/admin/jobs/${ID}`, undefined, false), {
      params: params(),
    });

    expect(response.status).toBe(401);
    expect(deleteJobPosting).not.toHaveBeenCalled();
  });

  it("deletes the posting and invalidates the jobs cache", async () => {
    deleteJobPosting.mockResolvedValue(true);
    const { DELETE } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await DELETE(await request("DELETE", `http://localhost/api/admin/jobs/${ID}`, undefined), {
      params: params(),
    });

    expect(response.status).toBe(200);
    expect(deleteJobPosting).toHaveBeenCalledWith(ID);
    expect(revalidateTag).toHaveBeenCalledWith("job-postings", { expire: 0 });
  });

  it("answers 404 without invalidating when there was nothing to delete", async () => {
    deleteJobPosting.mockResolvedValue(false);
    const { DELETE } = await import("@/app/api/admin/jobs/[id]/route");
    const response = await DELETE(await request("DELETE", `http://localhost/api/admin/jobs/${ID}`, undefined), {
      params: params(),
    });

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
