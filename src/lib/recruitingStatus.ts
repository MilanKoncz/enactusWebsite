import { recruitingWindow } from "@/content/recruiting";

/**
 * Where /mitmachen's application form gates between the countdown/reminder
 * state and the real form (docs/engineering.md). A pure function of "now",
 * kept separate from the ticking clock (useNow.ts) so it's testable without
 * mocking timers or rendering a component.
 */
export type RecruitingPhase = "before" | "open" | "after" | "unscheduled";

export function recruitingPhaseAt(nowMs: number): RecruitingPhase {
  const { opensAt, closesAt } = recruitingWindow;
  if (!opensAt || !closesAt) return "unscheduled";

  const opensMs = new Date(opensAt).getTime();
  const closesMs = new Date(closesAt).getTime();

  if (nowMs < opensMs) return "before";
  if (nowMs <= closesMs) return "open";
  return "after";
}
