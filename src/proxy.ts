import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // /styleguide lives at [locale]/styleguide — it still needs this middleware's
  // implicit-locale rewrite to resolve at all (that's how the unprefixed
  // German URL maps to the [locale]=de segment). It stays chrome-free via the
  // (site) route group, not via exclusion here.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
