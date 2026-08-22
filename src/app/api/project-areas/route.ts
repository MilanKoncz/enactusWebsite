import { NextResponse } from "next/server";
import { getProjectAreas } from "@/lib/projectAreas";

/**
 * Lets ApplicationForm.tsx (the /mitmachen application form) refresh its
 * "Wunschbereich" checkbox list after hydration, the same seam
 * /api/recruiting-windows already gives the recruiting-window data on the
 * same form — see that route's own comment for the full reasoning
 * (testability: this is the mockable HTTP call e2e tests intercept with
 * page.route(), where a value baked into the static page at build time
 * can't be; freshness: bridges the gap before the next ISR regeneration).
 *
 * No auth, no rate limit: this returns exactly the same public data
 * already embedded in the page's own HTML source.
 */
export async function GET() {
  const areas = await getProjectAreas();
  return NextResponse.json({ areas });
}
