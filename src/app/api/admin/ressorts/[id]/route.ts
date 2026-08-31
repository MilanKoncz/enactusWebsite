import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { deleteDepartment, updateDepartment } from "@/lib/db";
import { departmentFormSchema } from "@/lib/departmentFormSchema";
import { DEPARTMENTS_REVALIDATE, DEPARTMENTS_TAG } from "@/lib/departments";

// See the recruiting-windows/calendar-events routes' own comment on
// z.guid() vs z.uuid(): the stricter one requires RFC 9562 version/variant
// bits the Postgres uuid column doesn't guarantee.
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
  const parsed = departmentFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const updated = await updateDepartment(id.data, parsed.data);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    revalidateTag(DEPARTMENTS_TAG, DEPARTMENTS_REVALIDATE);
    return NextResponse.json({ ok: true, department: updated });
  } catch (error) {
    console.error("Failed to update department", error);
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
    const deleted = await deleteDepartment(id.data);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    revalidateTag(DEPARTMENTS_TAG, DEPARTMENTS_REVALIDATE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete department", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
