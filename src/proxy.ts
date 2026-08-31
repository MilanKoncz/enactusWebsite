import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isProductionDeployment } from "./lib/productionDeployment";

const intlMiddleware = createMiddleware(routing);

// Board-internal tooling has no translated UI worth a second URL for: the
// route lives under [locale] (this app's one root layout has no other place
// to put it — see [locale]/layout.tsx), but it must only ever answer at
// /admin/..., never at the /en-prefixed variant next-intl would otherwise
// route to a real, English-rendered copy of the same page.
const BLOCKED_ADMIN_PATH = /^\/en\/admin(\/|$)/;

export default function proxy(request: NextRequest) {
  if (BLOCKED_ADMIN_PATH.test(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const response = intlMiddleware(request);

  // robots.ts disallows every path outside the confirmed production
  // deployment (productionDeployment.ts), but a disallowed URL that's still
  // linked to elsewhere can still turn up in search results without a
  // snippet. This adds the belt-and-braces X-Robots-Tag: noindex header on
  // every actual response outside production, on top of that.
  if (!isProductionDeployment(request.headers.get("host"))) {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
}

export const config = {
  // Every page under [locale] — including /admin — still needs this
  // middleware's implicit-locale rewrite to resolve at all (that's how the
  // unprefixed German URL maps to the [locale]=de segment); /admin stays
  // chrome-free via the (site) route group, not via exclusion here, and is
  // kept off its /en-prefixed variant by BLOCKED_ADMIN_PATH above instead.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
