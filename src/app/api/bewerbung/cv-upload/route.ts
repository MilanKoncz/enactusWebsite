import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";
import { checkFormToken } from "@/lib/formToken";
import { deleteCvBlobs, isCvPathname, verifyUploadedPdf } from "@/lib/cvBlob";

// Matches applicationFormSchema.ts's CV_MAX_SIZE_BYTES — kept as its own
// constant here rather than importing that one, since this route enforces
// it as an upload-token constraint (maximumSizeInBytes), a different
// mechanism than the schema's own post-hoc check on the number the client
// reports about its file.
const CV_MAX_SIZE_BYTES = 4 * 1024 * 1024;

type ClientPayload = { formToken?: string };

function parseClientPayload(raw: string | null): ClientPayload {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ClientPayload) : {};
  } catch {
    return {};
  }
}

/**
 * The server half of the direct-to-Blob upload ApplicationForm.tsx starts
 * with `upload()` from @vercel/blob/client. Two responsibilities, per
 * handleUpload's own contract:
 *
 * 1. onBeforeGenerateToken — issues the short-lived client token the
 *    browser then uses to PUT the file straight to Vercel Blob, never
 *    through this server. This is the real gate on the store: a rate
 *    limit (lib/rateLimit.ts's "bewerbung-cv" bucket, tighter than the
 *    token route's own) plus the same signed, timed form-token every
 *    /api/bewerbung submission carries (lib/formToken.ts) — without
 *    both, this route would just be an open upload endpoint into a
 *    private store. `checkFormToken` only accepts `"valid"`; a token that
 *    is merely not-yet-expired-but-too-fast is rejected here exactly like
 *    an invalid one, since there's no silent-anti-spam concern for a
 *    server-to-server token check the way there is for a form submission.
 * 2. onUploadCompleted — Vercel Blob calls this back once the browser's
 *    PUT actually lands, so the upload can be checked against the real
 *    file bytes rather than the client's claimed Content-Type. This
 *    never fires against a localhost callback URL (Vercel Blob calls back
 *    over the public network, not to a dev server) — the same
 *    magic-byte check runs again in /api/bewerbung right before the
 *    insert, which is the check that actually runs everywhere.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimit = await checkRateLimit("bewerbung-cv", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isCvPathname(pathname)) {
          throw new Error("pathname must be under bewerbungen/");
        }
        const { formToken } = parseClientPayload(clientPayload);
        if (checkFormToken(formToken) !== "valid") {
          throw new Error("missing or invalid form token");
        }

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: CV_MAX_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        const isRealPdf = await verifyUploadedPdf(blob.pathname).catch((error: unknown) => {
          console.error("Failed to verify a completed CV upload", error);
          return false;
        });
        if (!isRealPdf) {
          await deleteCvBlobs([blob.pathname]).catch((error: unknown) => {
            console.error("Failed to delete a non-PDF upload", error);
          });
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("CV upload token generation failed", error);
    const message = error instanceof Error ? error.message : "server_error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
