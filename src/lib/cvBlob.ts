import { del, get, list } from "@vercel/blob";

/**
 * The only file that talks to Vercel Blob directly. Every route that
 * touches the CV store — the upload route, the admin download route, and
 * the cron cleanup pass — goes through the functions here, same boundary
 * lib/db.ts draws around Postgres and lib/mail.ts draws around Resend.
 *
 * No cached client object like lib/db.ts's `sql()`: @vercel/blob's
 * functions (`del`, `get`, `list`, and the ones called from the upload
 * route) read `BLOB_READ_WRITE_TOKEN` from `process.env` at call time, not
 * at import time, so they're already build-safe on their own — `next
 * build` never has to construct anything from this file. `requireBlobToken`
 * exists only to fail with a clear message instead of an SDK error deep in
 * a fetch call when the token is missing.
 *
 * The store (`enactus-bewerbungen`, region fra1) is private end to end —
 * every blob in it requires `BLOB_READ_WRITE_TOKEN` to read, regardless of
 * what a caller passes as `access`. That's a store-level setting made once
 * when it was provisioned, not something any function here enforces.
 */

export const CV_BLOB_PREFIX = "bewerbungen/";

function requireBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set — see .env.example and docs/deployment.md.");
  }
  return token;
}

// Every pathname the upload route accepts must live under this prefix —
// checked again here, not just in the route, so a future caller of
// isCvPathname can't skip the rule by constructing its own request.
export function isCvPathname(pathname: string): boolean {
  return pathname.startsWith(CV_BLOB_PREFIX);
}

const PDF_MAGIC_BYTES = "%PDF-";

// A Content-Type header is whatever the uploading client claims it is —
// trivially spoofed. This checks the first bytes of the actual file
// against the real PDF signature, the same test file(1) uses. Called from
// two places (onUploadCompleted, and again in /api/bewerbung right before
// the insert) because onUploadCompleted never fires against a localhost
// callback URL — see cv-upload/route.ts's own comment.
export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC_BYTES.length) return false;
  for (let i = 0; i < PDF_MAGIC_BYTES.length; i += 1) {
    if (bytes[i] !== PDF_MAGIC_BYTES.charCodeAt(i)) return false;
  }
  return true;
}

// Reads only the first chunk of the stream, not the whole file — the
// magic bytes are in the first five bytes, and pulling a multi-megabyte
// PDF into memory just to check its header would be wasted work on every
// single application.
export async function verifyUploadedPdf(pathnameOrUrl: string): Promise<boolean> {
  const result = await get(pathnameOrUrl, { access: "private", token: requireBlobToken() });
  if (!result || result.statusCode !== 200) return false;

  const reader = result.stream.getReader();
  try {
    const { value, done } = await reader.read();
    if (done || !value) return false;
    return hasPdfMagicBytes(value);
  } finally {
    await reader.cancel().catch(() => {
      // The connection is being torn down anyway; a cancel failure here
      // has nothing left to report to.
    });
  }
}

// A no-op on an empty array, not an error — every caller (the retention
// batch, the orphan sweep, a single admin delete) can call this
// unconditionally without checking length first.
export async function deleteCvBlobs(pathnamesOrUrls: string[]): Promise<void> {
  if (pathnamesOrUrls.length === 0) return;
  await del(pathnamesOrUrls, { token: requireBlobToken() });
}

export type CvBlobListEntry = {
  pathname: string;
  uploadedAt: Date;
};

// One page, not a full paginated walk — the cron route calls this with a
// bounded `limit` and picks up wherever it left off on the next day's run,
// same batching discipline as the retention pass. See
// app/api/cron/cleanup/route.ts's own comment on why nothing here tries to
// walk the whole store in one execution.
export async function listCvBlobs(limit: number): Promise<CvBlobListEntry[]> {
  const result = await list({ prefix: CV_BLOB_PREFIX, limit, token: requireBlobToken() });
  return result.blobs.map((blob) => ({ pathname: blob.pathname, uploadedAt: blob.uploadedAt }));
}

// Powers the admin CV download route: the blob is private, so a plain
// `fetch(url)` would 403. This is the one place outside the upload/cleanup
// paths allowed to read a blob's bytes.
export async function fetchCvBlob(
  pathnameOrUrl: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  const result = await get(pathnameOrUrl, { access: "private", token: requireBlobToken() });
  if (!result || result.statusCode !== 200) return null;
  return { stream: result.stream, contentType: result.blob.contentType };
}
