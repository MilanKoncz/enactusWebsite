import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import {
  deleteRecruitingWindow,
  findOverlappingRecruitingWindows,
  isUniqueViolation,
  updateRecruitingWindow,
} from "@/lib/db";
import { recruitingWindowFormSchema } from "@/lib/recruitingWindowFormSchema";
import { wallClockToInstant } from "@/lib/recruitingTime";
import { RECRUITING_WINDOWS_REVALIDATE, RECRUITING_WINDOWS_TAG } from "@/lib/recruitingWindows";

// See the POST route's comment on z.guid() vs z.uuid().
const idSchema = z.guid();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recruitingWindowFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const startsAt = wallClockToInstant(parsed.data.start);
  const endsAt = wallClockToInstant(parsed.data.end);

  try {
    // Excludes itself from the overlap check — a window always overlaps its
    // own current range, so without this every edit that kept the dates
    // would be rejected as a conflict with itself.
    const overlapping = await findOverlappingRecruitingWindows(startsAt, endsAt, id.data);
    if (overlapping.length > 0) {
      return NextResponse.json(
        { ok: false, error: "overlaps", semester: overlapping[0].semester },
        { status: 409 },
      );
    }

    const updated = await updateRecruitingWindow(id.data, parsed.data.semester, startsAt, endsAt);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    revalidateTag(RECRUITING_WINDOWS_TAG, RECRUITING_WINDOWS_REVALIDATE);
    return NextResponse.json({ ok: true, window: updated });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ ok: false, error: "duplicate_semester" }, { status: 409 });
    }
    console.error("Failed to update recruiting window", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

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
    const deleted = await deleteRecruitingWindow(id.data);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    revalidateTag(RECRUITING_WINDOWS_TAG, RECRUITING_WINDOWS_REVALIDATE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete recruiting window", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
