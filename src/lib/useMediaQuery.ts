import { useCallback, useSyncExternalStore } from "react";

// useSyncExternalStore, not a useEffect + setState pair — a media query is a
// live property of the browser external to React, and mirroring it via an
// effect would need a synchronous setState call on mount
// (react-hooks/set-state-in-effect flags that as an anti-pattern; it also
// causes an avoidable extra render). Server snapshot is `false`, since
// there's no matchMedia during SSR; every current caller (reduced motion,
// ProximityGroup's hover-capable check) treats `false` as the safe default
// until the client confirms otherwise.
//
// subscribe/getSnapshot are wrapped in useCallback keyed on `query` so their
// identity stays stable across re-renders with the same query string —
// without that, useSyncExternalStore would tear down and re-create the
// matchMedia listener on every render instead of once per query.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
