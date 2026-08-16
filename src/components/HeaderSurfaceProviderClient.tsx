// HeaderSurfaceProviderClient.tsx
"use client";

import { usePathname } from "next/navigation";
import { HeaderSurfaceProvider } from "@/components/layout/HeaderSurface";

export function HeaderSurfaceProviderClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <HeaderSurfaceProvider initialOverlaid={pathname === "/" || pathname === "/en"}>
      {children}
    </HeaderSurfaceProvider>
  );
}
