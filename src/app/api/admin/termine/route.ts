import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { insertCalendarEvent } from "@/lib/db";
import { calendarEventFormSchema } from "@/lib/calendarEventFormSchema";
import { CALENDAR_EVENTS_REVALIDATE, CALENDAR_EVENTS_TAG } from "@/lib/calendarEvents";

/**
 * Creates a calendar event. Same shape as
 * /api/admin/bewerbungsfenster/route.ts: auth first, schema second, then
 * the write — revalidateTag is what makes the change visible on the
 * homepage immediately rather than whenever its hour-long cache happens to
 * expire.
 */
export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = calendarEventFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const created = await insertCalendarEvent(parsed.data);
    revalidateTag(CALENDAR_EVENTS_TAG, CALENDAR_EVENTS_REVALIDATE);
    return NextResponse.json({ ok: true, event: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create calendar event", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
