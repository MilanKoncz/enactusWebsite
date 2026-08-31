import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { clearApplicationCv, findApplicationById } from "@/lib/db";
import { deleteCvBlobs, fetchCvBlob } from "@/lib/cvBlob";
import { filenameSegment } from "@/lib/filenameSegment";

// See the recruiting-windows/calendar-events routes' own comment on
// z.guid() vs z.uuid(): the stricter one requires RFC 9562 version/variant
// bits the Postgres uuid column doesn't guarantee.
const idSchema = z.guid();

type RouteContext = { params: Promise<{ id: string }> };

/**
 * The only route that ever reads a CV's actual bytes back out of Vercel
 * Blob. The store is private end to end (lib/cvBlob.ts's own comment), so
 * a leaked blob URL alone is useless — this route, not the URL, is the
 * access boundary, and it's gated exactly like every other admin mutation
 * here (isAuthenticatedRequest, checked before any lookup).
 *
 * Streamed with Content-Disposition: attachment and X-Content-Type-Options:
 * nosniff, never inline: a PDF is not something this route should ever let
 * a browser render directly, even for the board's own session — see
 * docs/engineering.md's note on why uploaded PDFs aren't scanned for
 * malware and what carries that risk instead.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  let application;
  try {
    application = await findApplicationById(id.data);
  } catch (error) {
    console.error("Failed to look up application for CV download", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  if (!application || !application.cvPathname) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const blob = await fetchCvBlob(application.cvPathname).catch((error: unknown) => {
    console.error("Failed to fetch CV blob", error);
    return null;
  });
  if (!blob) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // filenameSegment drops anything outside A-Za-z0-9-, so a name written
  // entirely in a non-Latin script (Cyrillic, CJK, Arabic, ...) sanitises to
  // an empty string on both segments — without this fallback two such
  // applicants would both download a file literally named "Bewerbung--.pdf".
  // Same guard the ICS route already has for the equivalent case
  // (filenameSegment(event.title) || event.id).
  const lastName = filenameSegment(application.lastName);
  const firstName = filenameSegment(application.firstName);
  const filename = lastName || firstName ? `Bewerbung-${lastName}-${firstName}.pdf` : `Bewerbung-${application.id}.pdf`;

  return new NextResponse(blob.stream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

// The admin's "CV jetzt löschen" action — clears the five cv_* columns
// without touching the application itself. Distinct from DELETE
// /api/admin/bewerbungen/[id], which removes the whole row.
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const cleared = await clearApplicationCv(id.data);
    if (cleared) {
      await deleteCvBlobs([cleared.cvPathname]).catch((error: unknown) => {
        console.error("Failed to delete the CV blob after clearing its columns", error);
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to clear application CV", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
