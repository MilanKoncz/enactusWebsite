"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type HeaderSurfaceContextValue = {
  overlaid: boolean;
  setOverlaid: (overlaid: boolean) => void;
};

// Default value is the solid-header state with a no-op setter, so Header
// works correctly even when rendered without a provider (every route except
// the homepage, and every existing Header test). Only a hero-style section
// needs to reach up and flip this.
export const HeaderSurfaceContext = createContext<HeaderSurfaceContextValue>({
  overlaid: false,
  setOverlaid: () => {},
});

export function HeaderSurfaceProvider({
  children,
  initialOverlaid = false,
}: {
  children: ReactNode;
  initialOverlaid?: boolean;
}) {
  const [overlaid, setOverlaid] = useState(initialOverlaid);
  return (
    <HeaderSurfaceContext.Provider value={{ overlaid, setOverlaid }}>
      {children}
    </HeaderSurfaceContext.Provider>
  );
}

export function useHeaderSurface(): HeaderSurfaceContextValue {
  return useContext(HeaderSurfaceContext);
}
