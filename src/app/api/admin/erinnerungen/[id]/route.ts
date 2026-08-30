import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { deleteReminderSignup } from "@/lib/db";

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
    const deleted = await deleteReminderSignup(id.data);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete reminder signup", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
