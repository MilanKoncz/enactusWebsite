import { recruitingWindows } from "@/content/recruiting";
import type { RecruitingWindow } from "@/content/recruiting";

/**
 * Where /mitmachen's application form gates between the countdown/reminder
 * state and the real form (docs/engineering.md). Pure functions of "now",
 * kept separate from the ticking clock (useNow.ts) so they're testable
 * without mocking timers or rendering a component.
 */
export type RecruitingPhase = "before" | "open" | "after" | "unscheduled";

function windowContaining(nowMs: number, windows: RecruitingWindow[]): RecruitingWindow | null {
  return (
    windows.find((window) => {
      const startMs = new Date(window.start).getTime();
      const endMs = new Date(window.end).getTime();
      return nowMs >= startMs && nowMs <= endMs;
    }) ?? null
  );
}

function nextUpcomingWindow(nowMs: number, windows: RecruitingWindow[]): RecruitingWindow | null {
  const upcoming = windows
    .filter((window) => new Date(window.start).getTime() > nowMs)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return upcoming[0] ?? null;
}

// The window /mitmachen should display: the one "now" falls inside, else the
// soonest one still ahead, else null once every known window has closed —
// the "after" phase then shows a generic closed message rather than a stale
// date (see ASSETS-TODO.md's note on a second cycle). Takes the window list
// as a parameter (defaulting to the real content) so tests can exercise the
// "several future windows" case without content/recruiting.ts needing a
// second real, confirmed cycle to exist yet.
export function currentOrNextRecruitingWindow(
  nowMs: number,
  windows: RecruitingWindow[] = recruitingWindows,
): RecruitingWindow | null {
  return windowContaining(nowMs, windows) ?? nextUpcomingWindow(nowMs, windows);
}

export function recruitingPhaseAt(nowMs: number): RecruitingPhase {
  if (recruitingWindows.length === 0) return "unscheduled";

  const window = currentOrNextRecruitingWindow(nowMs);
  if (!window) return "after";

  const startMs = new Date(window.start).getTime();
  const endMs = new Date(window.end).getTime();
  if (nowMs < startMs) return "before";
  if (nowMs <= endMs) return "open";
  return "after";
}
