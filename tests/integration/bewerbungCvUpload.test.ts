// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkRateLimit = vi.fn();
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

const verifyUploadedPdf = vi.fn();
const deleteCvBlobs = vi.fn();
vi.mock("@/lib/cvBlob", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cvBlob")>();
  return {
    ...actual,
    verifyUploadedPdf: (...args: unknown[]) => verifyUploadedPdf(...args),
    deleteCvBlobs: (...args: unknown[]) => deleteCvBlobs(...args),
  };
});

// handleUpload is @vercel/blob's own dispatcher: given a "generate client
// token" body it calls onBeforeGenerateToken and returns a client token;
// given an "upload completed" body (Vercel Blob's own server-to-server
// callback once a PUT actually lands) it calls onUploadCompleted. This
// stub reproduces exactly that dispatch, so the route's own callbacks —
// the part actually under test — run for real.
vi.mock("@vercel/blob/client", () => ({
  handleUpload: async ({
    body,
    onBeforeGenerateToken,
    onUploadCompleted,
  }: {
    body: {
      type: string;
      payload: { pathname?: string; clientPayload?: string | null; multipart?: boolean; blob?: unknown };
    };
    onBeforeGenerateToken: (pathname: string, clientPayload: string | null, multipart: boolean) => Promise<unknown>;
    onUploadCompleted: (payload: { blob: unknown; tokenPayload?: string | null }) => Promise<void>;
  }) => {
    if (body.type === "blob.generate-client-token") {
      const tokenOptions = await onBeforeGenerateToken(
        body.payload.pathname!,
        body.payload.clientPayload ?? null,
        body.payload.multipart ?? false,
      );
      return { type: "blob.generate-client-token" as const, clientToken: JSON.stringify(tokenOptions) };
    }
    await onUploadCompleted({ blob: body.payload.blob, tokenPayload: null });
    return { type: "blob.upload-completed" as const, response: "ok" as const };
  },
}));

const ORIGINAL_FORM_TOKEN_SECRET = process.env.FORM_TOKEN_SECRET;

function generateTokenRequest(pathname: string, clientPayload: string | null) {
  return new NextRequest("http://localhost/api/bewerbung/cv-upload", {
    method: "POST",
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname, clientPayload, multipart: false },
    }),
  });
}

function uploadCompletedRequest(blob: unknown) {
  return new NextRequest("http://localhost/api/bewerbung/cv-upload", {
    method: "POST",
    body: JSON.stringify({ type: "blob.upload-completed", payload: { blob } }),
  });
}

beforeEach(() => {
  process.env.FORM_TOKEN_SECRET = "a-form-token-signing-secret";
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  deleteCvBlobs.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_FORM_TOKEN_SECRET === undefined) delete process.env.FORM_TOKEN_SECRET;
  else process.env.FORM_TOKEN_SECRET = ORIGINAL_FORM_TOKEN_SECRET;
});

async function validFormToken(): Promise<string> {
  const { createFormToken } = await import("@/lib/formToken");
  const { MIN_FILL_MS } = await import("@/lib/antiSpam");
  const issuedAt = new Date(Date.now() - MIN_FILL_MS - 1000);
  return createFormToken(issuedAt)!;
}

describe("POST /api/bewerbung/cv-upload", () => {
  it("rejects a request over the rate limit before touching handleUpload at all", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const { POST } = await import("@/app/api/bewerbung/cv-upload/route");
    const response = await POST(generateTokenRequest("bewerbungen/lebenslauf.pdf", null));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limited" });
  });

  it("rejects a pathname outside bewerbungen/", async () => {
    const token = await validFormToken();
    const { POST } = await import("@/app/api/bewerbung/cv-upload/route");
    const response = await POST(
      generateTokenRequest("anders/lebenslauf.pdf", JSON.stringify({ formToken: token })),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a missing form token", async () => {
    const { POST } = await import("@/app/api/bewerbung/cv-upload/route");
    const response = await POST(generateTokenRequest("bewerbungen/lebenslauf.pdf", null));

    expect(response.status).toBe(400);
  });

  it("rejects a tampered form token", async () => {
    const { POST } = await import("@/app/api/bewerbung/cv-upload/route");
    const response = await POST(
      generateTokenRequest(
        "bewerbungen/lebenslauf.pdf",
        JSON.stringify({ formToken: "9999999999999.deadbeef" }),
      ),
    );

    expect(response.status).toBe(400);
  });

  it("issues a client token constrained to PDF and 4 MB for a valid request", async () => {
    const token = await validFormToken();
    const { POST } = await import("@/app/api/bewerbung/cv-upload/route");
    const response = await POST(
      generateTokenRequest("bewerbungen/lebenslauf.pdf", JSON.stringify({ formToken: token })),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    const tokenOptions = JSON.parse(body.clientToken);
    expect(tokenOptions.allowedContentTypes).toEqual(["application/pdf"]);
    expect(tokenOptions.maximumSizeInBytes).toBe(4 * 1024 * 1024);
    expect(tokenOptions.addRandomSuffix).toBe(true);
  });

  it("deletes the blob when onUploadCompleted's magic-byte check fails", async () => {
    verifyUploadedPdf.mockResolvedValue(false);
    const { POST } = await import("@/app/api/bewerbung/cv-upload/route");
    const response = await POST(uploadCompletedRequest({ pathname: "bewerbungen/fake.pdf" }));

    expect(response.status).toBe(200);
    expect(deleteCvBlobs).toHaveBeenCalledWith(["bewerbungen/fake.pdf"]);
  });

  it("does not delete the blob when onUploadCompleted's magic-byte check passes", async () => {
    verifyUploadedPdf.mockResolvedValue(true);
    const { POST } = await import("@/app/api/bewerbung/cv-upload/route");
    const response = await POST(uploadCompletedRequest({ pathname: "bewerbungen/real.pdf" }));

    expect(response.status).toBe(200);
    expect(deleteCvBlobs).not.toHaveBeenCalled();
  });
});
