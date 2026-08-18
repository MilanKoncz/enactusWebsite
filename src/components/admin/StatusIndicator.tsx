import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { MailStatus } from "@/lib/db";

/**
 * The admin area's one color+icon vocabulary for "is this okay" — used for
 * system reachability, cron results, and mail send status alike, so the
 * same four states always look the same wherever they appear. Color is
 * never the only signal: every level pairs its color with both an icon and
 * the label text passed in, never color alone.
 *
 * Three severity tiers plus "neutral" for a state that isn't good or bad,
 * just pending — `pending` mail status is exactly that, and forcing it into
 * "warning" would read as more urgent than "hasn't been attempted yet
 * actually is.
 */
export type StatusLevel = "ok" | "warning" | "error" | "neutral";

const LEVEL_ICON: Record<StatusLevel, LucideIcon> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  neutral: Clock,
};

const LEVEL_CLASSES: Record<StatusLevel, string> = {
  ok: "text-moss",
  warning: "text-amber",
  error: "text-oxblood",
  neutral: "text-ink opacity-60",
};

export function StatusIndicator({
  level,
  label,
  className,
}: {
  level: StatusLevel;
  label: string;
  className?: string;
}) {
  const Icon = LEVEL_ICON[level];
  return (
    <span className={cn("inline-flex items-center gap-2", LEVEL_CLASSES[level], className)}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </span>
  );
}

const MAIL_STATUS_LEVEL: Record<MailStatus, StatusLevel> = {
  pending: "neutral",
  sent: "ok",
  failed: "error",
};

// The one place a MailStatus (lib/db.ts) becomes a StatusLevel — every list
// showing a mail_status column (bewerbungen, kontakt) goes through this
// instead of repeating the mapping, or one of them drifting to call
// "pending" a warning while another calls it neutral.
export function MailStatusIndicator({ status, label }: { status: MailStatus; label: string }) {
  return <StatusIndicator level={MAIL_STATUS_LEVEL[status]} label={label} />;
}
