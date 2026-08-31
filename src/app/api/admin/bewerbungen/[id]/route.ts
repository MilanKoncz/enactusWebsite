import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { deleteApplication } from "@/lib/db";
import { deleteCvBlobs } from "@/lib/cvBlob";

// See the recruiting-windows/calendar-events routes' own comment on
// z.guid() vs z.uuid(): the stricter one requires RFC 9562 version/variant
// bits the Postgres uuid column doesn't guarantee.
const idSchema = z.guid();

type RouteContext = { params: Promise<{ id: string }> };

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
    const result = await deleteApplication(id.data);
    if (!result.deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    // Best-effort: the application row is already gone regardless of
    // whether this succeeds, and a failure here just means the CV-blob
    // pass's orphan sweep picks it up later instead.
    if (result.cvPathname) {
      await deleteCvBlobs([result.cvPathname]).catch((error: unknown) => {
        console.error("Failed to delete the CV blob for a manually deleted application", error);
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete application", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
