import { useCallback, useSyncExternalStore } from "react";

/**
 * A ticking clock as an external store — see useMediaQuery.ts for why
 * useSyncExternalStore, not a useEffect+setState pair, is the React 18+
 * correct shape for a value that lives outside React and changes on its own
 * schedule (here: every tick of the interval, not in response to a browser
 * event). Server/first-client-render snapshot is the Unix epoch (0), a
 * timestamp guaranteed to read as "before" any real recruiting window in
 * content/recruiting.ts — the same safe-default-until-the-client-confirms
 * philosophy useMediaQuery uses for prefers-reduced-motion, applied here so
 * a stale static build never shows an application form as open when it
 * shouldn't be.
 */
export function useNow(intervalMs = 1000): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const id = setInterval(onChange, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs],
  );
  const getSnapshot = useCallback(() => Date.now(), []);
  const getServerSnapshot = useCallback(() => 0, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
