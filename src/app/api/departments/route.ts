import { NextResponse } from "next/server";
import { getDepartments } from "@/lib/departments";

/**
 * Lets ApplicationForm.tsx (the /mitmachen application form) refresh its
 * "Ressort" checkbox list after hydration — same seam as
 * /api/project-areas, see that route's own comment for the full reasoning
 * (testability: this is the mockable HTTP call e2e tests intercept with
 * page.route(), where a value baked into the static page at build time
 * can't be; freshness: bridges the gap before the next ISR regeneration).
 *
 * No auth, no rate limit: this returns exactly the same public data
 * already embedded in the page's own HTML source.
 */
export async function GET() {
  const departments = await getDepartments();
  return NextResponse.json({ departments });
}
