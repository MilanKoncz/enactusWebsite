import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { deleteJobPosting, updateJobPosting } from "@/lib/db";
import { jobPostingFormSchema } from "@/lib/jobPostingFormSchema";
import { JOB_POSTINGS_REVALIDATE, JOB_POSTINGS_TAG } from "@/lib/jobPostings";

// See the recruiting-windows routes' own comment on z.guid() vs z.uuid():
// the stricter one requires RFC 9562 version/variant bits the Postgres
// uuid column doesn't guarantee.
const idSchema = z.guid();

type RouteContext = { params: Promise<{ id: string }> };

// The base schema, not jobPostingCreateSchema: the "not in the past"
// restriction is create-only (see jobPostingFormSchema.ts's own comment) —
// editing an already-expired posting must stay possible.
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
  const parsed = jobPostingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const updated = await updateJobPosting(id.data, parsed.data);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    revalidateTag(JOB_POSTINGS_TAG, JOB_POSTINGS_REVALIDATE);
    return NextResponse.json({ ok: true, job: updated });
  } catch (error) {
    console.error("Failed to update job posting", error);
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
    const deleted = await deleteJobPosting(id.data);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    revalidateTag(JOB_POSTINGS_TAG, JOB_POSTINGS_REVALIDATE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete job posting", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
