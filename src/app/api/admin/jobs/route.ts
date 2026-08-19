import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { insertJobPosting } from "@/lib/db";
import { jobPostingCreateSchema } from "@/lib/jobPostingFormSchema";
import { JOB_POSTINGS_REVALIDATE, JOB_POSTINGS_TAG } from "@/lib/jobPostings";

/**
 * Creates a job posting. Same shape as /api/admin/termine/route.ts: auth
 * first, schema second (the create-only "not in the past" schema — see
 * lib/jobPostingFormSchema.ts), then the write — revalidateTag is what
 * makes the change visible on /jobs and in the nav/footer immediately
 * rather than whenever its hour-long cache happens to expire.
 */
export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = jobPostingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const created = await insertJobPosting(parsed.data);
    revalidateTag(JOB_POSTINGS_TAG, JOB_POSTINGS_REVALIDATE);
    return NextResponse.json({ ok: true, job: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create job posting", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
