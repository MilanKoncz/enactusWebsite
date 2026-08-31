import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { insertDepartment } from "@/lib/db";
import { departmentFormSchema } from "@/lib/departmentFormSchema";
import { DEPARTMENTS_REVALIDATE, DEPARTMENTS_TAG } from "@/lib/departments";

/**
 * Creates a department ("Ressort"). Same shape as
 * /api/admin/wunschbereiche/route.ts: auth first, schema second, then the
 * write — revalidateTag makes a new/reactivated department appear on
 * /mitmachen immediately rather than whenever its hour-long cache happens
 * to expire.
 */
export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = departmentFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const created = await insertDepartment(parsed.data);
    revalidateTag(DEPARTMENTS_TAG, DEPARTMENTS_REVALIDATE);
    return NextResponse.json({ ok: true, department: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create department", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
