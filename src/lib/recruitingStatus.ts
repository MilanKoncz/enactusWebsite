import type { RecruitingWindow } from "@/content/recruiting";

/**
 * Where /mitmachen's application form gates between the countdown/reminder
 * state and the real form (docs/engineering.md). Pure functions of "now"
 * and an explicit window list, kept separate from the ticking clock
 * (useNow.ts) and from where the windows come from (lib/recruitingWindows.ts)
 * so they're testable without mocking timers, a database, or a cache.
 */
export type RecruitingPhase = "before" | "open" | "after" | "unscheduled";

// Exported for lib/recruitingSemester.ts (resolveApplicationSemester) and
// lib/retentionCutoff.ts (applicationRetainUntil) — both need "the window a
// given instant falls inside, if any" and previously duplicated this same
// find() rather than share it.
export function windowContaining(nowMs: number, windows: RecruitingWindow[]): RecruitingWindow | null {
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
// date.
export function currentOrNextRecruitingWindow(
  nowMs: number,
  windows: RecruitingWindow[],
): RecruitingWindow | null {
  return windowContaining(nowMs, windows) ?? nextUpcomingWindow(nowMs, windows);
}

export function recruitingPhaseAt(nowMs: number, windows: RecruitingWindow[]): RecruitingPhase {
  if (windows.length === 0) return "unscheduled";

  const window = currentOrNextRecruitingWindow(nowMs, windows);
  if (!window) return "after";

  const startMs = new Date(window.start).getTime();
  const endMs = new Date(window.end).getTime();
  if (nowMs < startMs) return "before";
  if (nowMs <= endMs) return "open";
  return "after";
}
