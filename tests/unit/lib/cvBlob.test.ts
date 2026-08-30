import { afterEach, describe, expect, it, vi } from "vitest";

const { delMock, getMock, listMock } = vi.hoisted(() => ({
  delMock: vi.fn(),
  getMock: vi.fn(),
  listMock: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  del: delMock,
  get: getMock,
  list: listMock,
}));

const ORIGINAL_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
  else process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_TOKEN;
  vi.clearAllMocks();
});

function streamOf(bytes: number[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes));
      controller.close();
    },
  });
}

describe("isCvPathname", () => {
  it("accepts a pathname under bewerbungen/", async () => {
    const { isCvPathname } = await import("@/lib/cvBlob");
    expect(isCvPathname("bewerbungen/lebenslauf-abc123.pdf")).toBe(true);
  });

  it("rejects a pathname outside bewerbungen/", async () => {
    const { isCvPathname } = await import("@/lib/cvBlob");
    expect(isCvPathname("anders/lebenslauf.pdf")).toBe(false);
    expect(isCvPathname("../bewerbungen/lebenslauf.pdf")).toBe(false);
  });
});

describe("hasPdfMagicBytes", () => {
  it("accepts a real PDF header", async () => {
    const { hasPdfMagicBytes } = await import("@/lib/cvBlob");
    const bytes = new TextEncoder().encode("%PDF-1.7\n rest of file");
    expect(hasPdfMagicBytes(bytes)).toBe(true);
  });

  it("rejects a renamed non-PDF file", async () => {
    const { hasPdfMagicBytes } = await import("@/lib/cvBlob");
    const bytes = new TextEncoder().encode("PK not actually a pdf");
    expect(hasPdfMagicBytes(bytes)).toBe(false);
  });

  it("rejects a file shorter than the signature", async () => {
    const { hasPdfMagicBytes } = await import("@/lib/cvBlob");
    expect(hasPdfMagicBytes(new TextEncoder().encode("%PD"))).toBe(false);
  });

  it("rejects an empty file", async () => {
    const { hasPdfMagicBytes } = await import("@/lib/cvBlob");
    expect(hasPdfMagicBytes(new Uint8Array())).toBe(false);
  });
});

describe("verifyUploadedPdf", () => {
  it("throws a clear error when BLOB_READ_WRITE_TOKEN is unset", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    vi.resetModules();
    const { verifyUploadedPdf } = await import("@/lib/cvBlob");
    await expect(verifyUploadedPdf("bewerbungen/x.pdf")).rejects.toThrow(
      /BLOB_READ_WRITE_TOKEN is not set/,
    );
  });

  it("returns true for a blob whose first bytes are a real PDF signature", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    getMock.mockResolvedValue({
      statusCode: 200,
      stream: streamOf(Array.from(new TextEncoder().encode("%PDF-1.4 rest"))),
      blob: { contentType: "application/pdf" },
    });
    const { verifyUploadedPdf } = await import("@/lib/cvBlob");
    await expect(verifyUploadedPdf("bewerbungen/x.pdf")).resolves.toBe(true);
  });

  it("returns false for a blob whose bytes are not a PDF", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    getMock.mockResolvedValue({
      statusCode: 200,
      stream: streamOf(Array.from(new TextEncoder().encode("not a pdf at all"))),
      blob: { contentType: "application/pdf" },
    });
    const { verifyUploadedPdf } = await import("@/lib/cvBlob");
    await expect(verifyUploadedPdf("bewerbungen/x.pdf")).resolves.toBe(false);
  });

  it("returns false when the blob can't be found", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    getMock.mockResolvedValue(null);
    const { verifyUploadedPdf } = await import("@/lib/cvBlob");
    await expect(verifyUploadedPdf("bewerbungen/missing.pdf")).resolves.toBe(false);
  });
});

describe("deleteCvBlobs", () => {
  it("is a no-op on an empty array, never calling del", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    const { deleteCvBlobs } = await import("@/lib/cvBlob");
    await deleteCvBlobs([]);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("passes every pathname to a single del() call", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    delMock.mockResolvedValue(undefined);
    const { deleteCvBlobs } = await import("@/lib/cvBlob");
    await deleteCvBlobs(["bewerbungen/a.pdf", "bewerbungen/b.pdf"]);
    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock).toHaveBeenCalledWith(
      ["bewerbungen/a.pdf", "bewerbungen/b.pdf"],
      expect.objectContaining({ token: "test-token" }),
    );
  });
});

describe("listCvBlobs", () => {
  it("lists under the bewerbungen/ prefix with the given limit", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    listMock.mockResolvedValue({
      blobs: [{ pathname: "bewerbungen/a.pdf", uploadedAt: new Date("2026-08-01T00:00:00Z") }],
    });
    const { listCvBlobs } = await import("@/lib/cvBlob");
    const result = await listCvBlobs(100);
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: "bewerbungen/", limit: 100 }),
    );
    expect(result).toEqual([{ pathname: "bewerbungen/a.pdf", uploadedAt: new Date("2026-08-01T00:00:00Z") }]);
  });
});

describe("fetchCvBlob", () => {
  it("returns the stream and content type for an existing blob", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    const stream = streamOf([1, 2, 3]);
    getMock.mockResolvedValue({ statusCode: 200, stream, blob: { contentType: "application/pdf" } });
    const { fetchCvBlob } = await import("@/lib/cvBlob");
    const result = await fetchCvBlob("bewerbungen/a.pdf");
    expect(result).toEqual({ stream, contentType: "application/pdf" });
  });

  it("returns null when the blob is missing", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.resetModules();
    getMock.mockResolvedValue(null);
    const { fetchCvBlob } = await import("@/lib/cvBlob");
    await expect(fetchCvBlob("bewerbungen/missing.pdf")).resolves.toBeNull();
  });
});
