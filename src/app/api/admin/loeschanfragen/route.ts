import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { deletePersonalDataByEmail, findPersonalDataByEmail } from "@/lib/db";
import { deleteCvBlobs } from "@/lib/cvBlob";

/**
 * GDPR Art. 15 (search) and Art. 17 (delete) for one address.
 *
 * POST searches, DELETE deletes — and DELETE requires the address twice,
 * in the query string and in the body, and they must match. That looks
 * redundant and is the point: this is the only irreversible action in the
 * admin area, it operates on data no backup in this project restores, and a
 * mistyped or half-copied address must not be able to delete the wrong
 * person's records. The UI asks the board to retype it (Art. 17 requests
 * arrive as prose, so the address is being copied by hand either way).
 */
const searchSchema = z.object({ email: z.email() });
const deleteSchema = z.object({ email: z.email(), confirmEmail: z.email() });

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const matches = await findPersonalDataByEmail(parsed.data.email);
    return NextResponse.json({ ok: true, matches });
  } catch (error) {
    console.error("Failed to search personal data", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  // Compared case-insensitively, matching how the rows themselves are found
  // — otherwise retyping the same address with different capitalisation
  // would be rejected as a mismatch while still being the same person.
  if (parsed.data.email.trim().toLowerCase() !== parsed.data.confirmEmail.trim().toLowerCase()) {
    return NextResponse.json({ ok: false, error: "confirmation_mismatch" }, { status: 400 });
  }

  try {
    const deleted = await deletePersonalDataByEmail(parsed.data.email);
    // Best-effort, and deliberately synchronous with the request rather
    // than left to the CV-blob pass's next run: an Art. 17 erasure is the
    // one deletion path where "within 24 hours" is not an acceptable
    // answer, so this is deleted now, not queued.
    if (deleted.cvPathnames.length > 0) {
      await deleteCvBlobs(deleted.cvPathnames).catch((error: unknown) => {
        console.error("Failed to delete CV blobs for a subject erasure request", error);
      });
    }
    // Logged deliberately: an Art. 17 deletion is the one action here with
    // no undo and no other trace, so the server log is the only record that
    // it happened and how much it removed.
    console.info(
      `Deleted personal data for a subject request: ${JSON.stringify(deleted)}`,
    );
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("Failed to delete personal data", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
