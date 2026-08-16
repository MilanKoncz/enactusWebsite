"use client";

import { HeaderSurfaceProvider } from "@/components/layout/HeaderSurface";
import { usePathname } from "@/lib/navigation";

// Routes whose page opens with a full-bleed dark hero that the fixed header
// sits transparent over (HeaderOverlay). Only the homepage does today.
//
// next-intl's usePathname, never next/navigation's: the proxy rewrites the
// unprefixed German route to /de internally, so next/navigation reports
// "/de" while prerendering and "/" after hydration. That mismatch is exactly
// what made the German homepage paint the header solid — black wordmark on
// the dark hero — and then swap to the white one a frame after hydration,
// while /en, whose prefixed path matched on both sides, never flickered.
// next-intl's version strips the locale prefix, so both locales resolve to
// "/" on the server and on the client, and the header's surface is settled
// in the prerendered HTML rather than discovered afterwards.
const OVERLAID_ROUTES = new Set(["/"]);

export function HeaderSurfaceProviderClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <HeaderSurfaceProvider initialOverlaid={OVERLAID_ROUTES.has(pathname)}>
      {children}
    </HeaderSurfaceProvider>
  );
}
