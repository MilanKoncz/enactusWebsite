import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { findOverlappingRecruitingWindows, insertRecruitingWindow, isUniqueViolation } from "@/lib/db";
import { recruitingWindowFormSchema } from "@/lib/recruitingWindowFormSchema";
import { wallClockToInstant } from "@/lib/recruitingTime";
import { RECRUITING_WINDOWS_REVALIDATE, RECRUITING_WINDOWS_TAG } from "@/lib/recruitingWindows";

/**
 * Creates a recruiting window. The revalidateTag call is what makes the
 * change visible on the public /mitmachen page immediately rather than
 * whenever its hour-long cache happens to expire — without it the board
 * would open a window and find the site still saying "closed", which is the
 * exact confusion the caching was supposed to be invisible for.
 */
export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recruitingWindowFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const startsAt = wallClockToInstant(parsed.data.start);
  const endsAt = wallClockToInstant(parsed.data.end);

  try {
    const overlapping = await findOverlappingRecruitingWindows(startsAt, endsAt);
    if (overlapping.length > 0) {
      return NextResponse.json(
        { ok: false, error: "overlaps", semester: overlapping[0].semester },
        { status: 409 },
      );
    }

    const created = await insertRecruitingWindow(parsed.data.semester, startsAt, endsAt);
    revalidateTag(RECRUITING_WINDOWS_TAG, RECRUITING_WINDOWS_REVALIDATE);
    return NextResponse.json({ ok: true, window: created }, { status: 201 });
  } catch (error) {
    // The unique constraint on `semester` is the other way this fails, and
    // it's a normal mistake (entering HWS26 twice) rather than a bug —
    // reported as a conflict, not a 500.
    if (isUniqueViolation(error)) {
      return NextResponse.json({ ok: false, error: "duplicate_semester" }, { status: 409 });
    }
    console.error("Failed to create recruiting window", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
