import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { insertProjectArea } from "@/lib/db";
import { projectAreaFormSchema } from "@/lib/projectAreaFormSchema";
import { PROJECT_AREAS_REVALIDATE, PROJECT_AREAS_TAG } from "@/lib/projectAreas";

/**
 * Creates a project area ("Wunschbereich"). Same shape as
 * /api/admin/termine/route.ts: auth first, schema second, then the write —
 * revalidateTag makes a new/reactivated area appear on /mitmachen
 * immediately rather than whenever its hour-long cache happens to expire.
 */
export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = projectAreaFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const created = await insertProjectArea(parsed.data);
    revalidateTag(PROJECT_AREAS_TAG, PROJECT_AREAS_REVALIDATE);
    return NextResponse.json({ ok: true, area: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project area", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
