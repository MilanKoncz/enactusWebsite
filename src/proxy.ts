import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isProductionDeployment } from "./lib/productionDeployment";

const intlMiddleware = createMiddleware(routing);

// robots.ts disallows every path outside the confirmed production
// deployment (productionDeployment.ts), but a disallowed URL that's still
// linked to elsewhere can still turn up in search results without a
// snippet. This adds the belt-and-braces X-Robots-Tag: noindex header on
// every actual response outside production, on top of that.
export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  if (!isProductionDeployment(request.headers.get("host"))) {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
}

export const config = {
  // /styleguide lives at [locale]/styleguide — it still needs this middleware's
  // implicit-locale rewrite to resolve at all (that's how the unprefixed
  // German URL maps to the [locale]=de segment). It stays chrome-free via the
  // (site) route group, not via exclusion here.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
