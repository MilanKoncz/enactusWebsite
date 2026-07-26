import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// useSyncExternalStore, not a useEffect + setState pair — reduced-motion is
// a live property of the browser external to React, and mirroring it via an
// effect would need a synchronous setState call on mount
// (react-hooks/set-state-in-effect flags that as an anti-pattern; it also
// causes an avoidable extra render). Server snapshot is `false`, since
// there's no matchMedia during SSR.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
