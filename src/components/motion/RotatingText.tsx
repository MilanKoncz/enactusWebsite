"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export type RotatingTextProps = {
  terms: string[];
  typingMs?: number;
  deletingMs?: number;
  holdMs?: number;
  pauseMs?: number;
  className?: string;
};

type Phase = "typing" | "holding" | "deleting" | "pausing";

// Typewriter effect (board feedback: match the old site's hero — type a
// term, hold, delete, move to the next one, cursor blinking throughout).
// The box is sized to the longest term via the same CSS Grid stacking trick
// the old crossfade version used (a same-cell invisible sizer forces the
// track's width from first paint, so the shrinking/growing typed text can
// never shift surrounding layout) — see the grid comment below. Under
// prefers-reduced-motion the typing loop never starts at all (a timer-driven
// text mutation, unlike the caret's blink, isn't something a CSS media query
// can stop on its own) and the first term is shown fully typed and static.
// A static sr-only span carries that same first term so assistive tech
// reads one stable sentence, never a repeating announcement of partial
// words as they're typed and deleted.
export function RotatingText({
  terms,
  typingMs = 70,
  deletingMs = 40,
  holdMs = 1800,
  pauseMs = 400,
  className,
}: RotatingTextProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [typed, setTyped] = useState("");
  const termIndex = useRef(0);
  const charCount = useRef(0);
  const phase = useRef<Phase>("typing");

  useEffect(() => {
    if (reducedMotion || terms.length === 0) return;

    let timeoutId: number;

    function tick() {
      const term = terms[termIndex.current % terms.length];

      switch (phase.current) {
        case "typing": {
          charCount.current += 1;
          setTyped(term.slice(0, charCount.current));
          if (charCount.current >= term.length) {
            phase.current = "holding";
            timeoutId = window.setTimeout(tick, holdMs);
          } else {
            timeoutId = window.setTimeout(tick, typingMs);
          }
          return;
        }
        case "holding": {
          phase.current = "deleting";
          timeoutId = window.setTimeout(tick, deletingMs);
          return;
        }
        case "deleting": {
          charCount.current -= 1;
          setTyped(term.slice(0, charCount.current));
          if (charCount.current <= 0) {
            phase.current = "pausing";
            termIndex.current = (termIndex.current + 1) % terms.length;
            timeoutId = window.setTimeout(tick, pauseMs);
          } else {
            timeoutId = window.setTimeout(tick, deletingMs);
          }
          return;
        }
        case "pausing": {
          phase.current = "typing";
          timeoutId = window.setTimeout(tick, typingMs);
        }
      }
    }

    timeoutId = window.setTimeout(tick, typingMs);
    return () => window.clearTimeout(timeoutId);
  }, [reducedMotion, terms, typingMs, deletingMs, holdMs, pauseMs]);

  const longestTerm = terms.reduce((longest, term) => (term.length > longest.length ? term : longest), "");
  const visibleText = reducedMotion ? (terms[0] ?? "") : typed;

  return (
    // Both children share col-start-1/row-start-1 so CSS Grid sizes the
    // track to the widest one placed in it (the full-length sizer) even
    // though the typed text is usually shorter — the box is as wide as the
    // longest term from first paint, and typing/deleting can never shift
    // anything around it (docs/design-system.md motion rule 5: no
    // animating width/height, and this sidesteps the need to).
    <span className={cn("inline-grid text-left", className)}>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-pre">
        {longestTerm}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1 whitespace-pre">
        {visibleText}
        <span aria-hidden="true" className="-mr-[2px] inline-block w-[2px] translate-y-[0.05em] animate-caret-blink bg-gold align-middle" />
      </span>
      <span className="sr-only">{terms[0]}</span>
    </span>
  );
}
