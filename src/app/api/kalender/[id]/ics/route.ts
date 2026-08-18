import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { findCalendarEventById } from "@/lib/db";
import { buildIcs } from "@/lib/ics";
import { filenameSegment } from "@/lib/filenameSegment";

// See the admin routes' own comment on z.guid() vs z.uuid(): the stricter
// one requires RFC 9562 version/variant bits the Postgres uuid column
// doesn't guarantee.
const idSchema = z.guid();

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Generates an .ics file for one calendar event — the "Zum Kalender
 * hinzufügen" button on the homepage. Public and unauthenticated: this is
 * exactly the same public data already shown on the page, just in a format
 * a calendar app can import, the same reasoning /api/calendar-events and
 * /api/recruiting-windows already use for not requiring a session or a
 * rate limit.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  let event;
  try {
    event = await findCalendarEventById(id.data);
  } catch (error) {
    console.error("Failed to load calendar event for the ics export", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const ics = buildIcs(event);
  // A title in mostly non-ASCII text (an umlaut-heavy word, say) can
  // sanitise down to nothing — the event id is always a safe non-empty
  // fallback for the filename itself.
  const filename = filenameSegment(event.title) || event.id;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}
