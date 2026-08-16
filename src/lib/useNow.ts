import { useCallback, useRef, useSyncExternalStore } from "react";

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
 *
 * `getSnapshot` reads a ref, not `Date.now()` directly — that was the
 * original shape here, and it was wrong: useSyncExternalStore's contract
 * requires getSnapshot to return the *same* value between two store
 * notifications, but a raw `Date.now()` call never does — real wall-clock
 * milliseconds have already moved on by the time React calls it a second
 * time to double-check for tearing, so React perceived the store as
 * constantly changing and re-rendered forever ("Maximum update depth
 * exceeded", reproducible on /mitmachen, the one page using this hook).
 * The ref is only ever written from inside `subscribe` — once immediately,
 * so the real time replaces the server's `0` snapshot right after mount
 * instead of waiting a full interval, and again on every tick — so
 * `getSnapshot` reads a value that's genuinely stable in between.
 */
export function useNow(intervalMs = 1000): number {
  const nowRef = useRef(0);

  const subscribe = useCallback(
    (onChange: () => void) => {
      nowRef.current = Date.now();
      onChange();
      const id = setInterval(() => {
        nowRef.current = Date.now();
        onChange();
      }, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs],
  );
  const getSnapshot = useCallback(() => nowRef.current, []);
  const getServerSnapshot = useCallback(() => 0, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
