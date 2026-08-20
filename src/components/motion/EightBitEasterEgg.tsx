"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { routes } from "@/content/navigation";
import { usePathname } from "@/lib/navigation";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Easter egg 3/3 (docs/eastereggs.md). A small logo occasionally peeks up
// from the bottom of the footer; clicking it switches the whole site into
// an 8-bit look for 60 seconds. The look itself is a single CSS layer keyed
// off html[data-eight-bit] (globals.css) — this component only owns the
// timing state machine, never touches component markup or styling
// directly, so there is no second layout and nothing here duplicates an
// existing component.
const MIN_HIDDEN_MS = 10_000;
const MAX_HIDDEN_MS = 90_000;
const MIN_PEEK_MS = 3_000;
const MAX_PEEK_MS = 6_000;
const TRANSITION_MS = 1_000;
const ACTIVE_DURATION_MS = 60_000;

type Phase = "off" | "entering" | "active" | "exiting";

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// /impressum, /datenschutz, and the whole admin area never get the peek
// button (or the mode) at all — legal text and board tooling stay
// unaffected on their own terms, not just "the mode happens to never
// survive navigating there" (see the pathname-change effect below for that
// second, independent guarantee).
function isExcludedRoute(pathname: string): boolean {
  return pathname === routes.impressum || pathname === routes.datenschutz || pathname.startsWith("/admin");
}

export function EightBitEasterEgg() {
  const t = useTranslations("EightBit");
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const excluded = isExcludedRoute(pathname);

  const [phase, setPhase] = useState<Phase>("off");
  const [peeking, setPeeking] = useState(false);
  const [peekLeft, setPeekLeft] = useState(50);

  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (scheduleRef.current) clearTimeout(scheduleRef.current);
    if (transitionRef.current) clearTimeout(transitionRef.current);
    if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
  }, []);

  // The peek-button cycle: hidden for a while, then visible for a few
  // seconds, then hidden again — runs continuously regardless of whether
  // 8-bit mode itself is currently active, except on an excluded route or
  // under reduced motion, where it never starts at all.
  useEffect(() => {
    if (excluded || reducedMotion) {
      return;
    }
    let cancelled = false;

    function hideThenPeek() {
      scheduleRef.current = setTimeout(() => {
        if (cancelled) return;
        setPeekLeft(randomBetween(8, 88));
        setPeeking(true);
        scheduleRef.current = setTimeout(() => {
          if (cancelled) return;
          setPeeking(false);
          hideThenPeek();
        }, randomBetween(MIN_PEEK_MS, MAX_PEEK_MS));
      }, randomBetween(MIN_HIDDEN_MS, MAX_HIDDEN_MS));
    }

    hideThenPeek();
    return () => {
      cancelled = true;
      if (scheduleRef.current) clearTimeout(scheduleRef.current);
    };
  }, [excluded, reducedMotion]);

  const exitMode = useCallback(() => {
    setPhase((current) => {
      if (current === "off" || current === "exiting") return current;
      return "exiting";
    });
  }, []);

  // A page change never lets the mode survive it — an abrupt reset, not the
  // usual eased exit, since the component this state lives in may not even
  // be the same page's DOM a moment later.
  const isFirstPathnameRender = useRef(true);
  useEffect(() => {
    if (isFirstPathnameRender.current) {
      isFirstPathnameRender.current = false;
      return;
    }
    clearAllTimers();
    setPhase("off");
    // Only the pathname identity should re-run this; clearAllTimers is a
    // stable useCallback([]).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (phase === "entering") {
      transitionRef.current = setTimeout(() => {
        setPhase("active");
        activeTimerRef.current = setTimeout(exitMode, ACTIVE_DURATION_MS);
      }, TRANSITION_MS);
    } else if (phase === "exiting") {
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      transitionRef.current = setTimeout(() => setPhase("off"), TRANSITION_MS);
    }
    // Cancels a pending "entering" -> "active" (or "exiting" -> "off")
    // timeout the moment phase changes again before it fires — without
    // this, clicking the off-switch mid-transition (or a pathname change
    // resetting phase directly) leaves a stale timeout that later flips
    // phase back on its own, several seconds after the user thought they'd
    // exited.
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, [phase, exitMode]);

  // Reflects phase onto the one html attribute the CSS layer reads —
  // globals.css does the rest. Removed on unmount so a hot-reload or an
  // unexpected unmount can never leave the site stuck in 8-bit mode.
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "off") {
      delete root.dataset.eightBit;
    } else {
      root.dataset.eightBit = phase;
    }
    return () => {
      delete root.dataset.eightBit;
    };
  }, [phase]);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  // Escape ends the mode from anywhere on the page, not just while the
  // off-switch has focus — the brief's second of the two explicit exits.
  useEffect(() => {
    if (phase !== "active" && phase !== "entering") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") exitMode();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, exitMode]);

  if (excluded) return null;

  // Gated here rather than by calling setPeeking(false) from inside the
  // cycle effect above (which would be a synchronous setState-in-effect —
  // React flags this as a cascading-render risk, the same reasoning
  // ProcessTimeline.tsx's useHasMounted comment documents for its own
  // mount-effect): reducedMotion flipping true mid-session (a live OS
  // preference change) should make the button inert immediately, without
  // waiting for the cycle's own pending timeout to notice.
  const isPeeking = peeking && !reducedMotion;

  return (
    <>
      {/* A real button with an accessible name, but tabIndex={-1}: reachable
          by click or touch, never by Tab, so the page's keyboard order is
          unchanged (CLAUDE.md brief) — this is a hidden bonus for a pointer
          user to stumble onto, not a control a keyboard user is expected to
          reach. Its own click handler is gated by `isPeeking` rather than an
          aria-hidden/inert swap, since it's a real interactive element the
          whole time; pointer-events-none while not peeking is what actually
          keeps it unclickable in its resting state. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("peekButtonLabel")}
        onClick={() => {
          if (isPeeking && phase === "off") setPhase("entering");
        }}
        style={{ left: `${peekLeft}%` }}
        className={
          "absolute bottom-1 z-10 -translate-x-1/2 rounded-full transition-[transform,opacity] duration-300 ease-signature " +
          (isPeeking
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0")
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a tiny,
            purely decorative mark; next/image's pipeline is overhead a
            22px icon that only ever renders for a few seconds doesn't need. */}
        <img
          src="/brand/enactus-mannheim-logo-mark.png"
          alt=""
          className="size-6 object-contain drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]"
        />
      </button>

      {(phase === "active" || phase === "entering") && (
        <button
          type="button"
          onClick={exitMode}
          className="fixed bottom-4 right-4 z-50 rounded-md border border-gold bg-ink px-4 py-2 font-mono text-mono-xs uppercase text-paper shadow-lg transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px focus-visible:-translate-y-px"
        >
          {t("offSwitchLabel")}
        </button>
      )}
    </>
  );
}
