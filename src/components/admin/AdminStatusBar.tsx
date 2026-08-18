import { Card } from "@/components/ui/Card";
import { StatusIndicator } from "@/components/admin/StatusIndicator";

/**
 * The five signals /admin's own brief asked for, at a glance: new
 * applications in the running window, failed mails, whether a future
 * application window exists, whether the retention cron last ran, and the
 * next calendar event. A pure presentational component — the page does
 * every query and settles each one independently (one dependency failing
 * must not blank the whole bar), this only turns already-resolved values
 * into tiles.
 *
 * Every tile that can signal a problem uses StatusIndicator (color + icon +
 * text, never color alone); the two purely informational tiles (the
 * application count, the next event) stay plain — there's nothing to warn
 * about in a number or a date by itself.
 */
export type AdminStatusBarProps = {
  applicationsInWindow: { count: number; semester: string } | null;
  failedMailsCount: number;
  hasFutureRecruitingWindow: boolean;
  cronStale: boolean;
  cronLastRunAt: Date | null;
  nextEvent: { title: string; date: string } | null;
  labels: {
    applicationsHeading: string;
    applicationsNoWindow: string;
    failedMailsHeading: string;
    failedMailsOk: string;
    failedMailsWarning: (count: number) => string;
    futureWindowHeading: string;
    futureWindowOk: string;
    futureWindowWarning: string;
    cronHeading: string;
    cronOk: (when: string) => string;
    cronNeverRan: string;
    cronStaleLabel: (when: string) => string;
    nextEventHeading: string;
    nextEventEmpty: string;
  };
  dateFormatter: Intl.DateTimeFormat;
};

export function AdminStatusBar({
  applicationsInWindow,
  failedMailsCount,
  hasFutureRecruitingWindow,
  cronStale,
  cronLastRunAt,
  nextEvent,
  labels,
  dateFormatter,
}: AdminStatusBarProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <li>
        <Card className="flex flex-col gap-1">
          <p className="text-body-s opacity-60">{labels.applicationsHeading}</p>
          {applicationsInWindow ? (
            <>
              <p className="font-mono text-display-3 tabular-nums">{applicationsInWindow.count}</p>
              <p className="text-body-s opacity-60">{applicationsInWindow.semester}</p>
            </>
          ) : (
            <StatusIndicator level="neutral" label={labels.applicationsNoWindow} />
          )}
        </Card>
      </li>

      <li>
        <Card className="flex flex-col gap-1">
          <p className="text-body-s opacity-60">{labels.failedMailsHeading}</p>
          <p className="font-mono text-display-3 tabular-nums">{failedMailsCount}</p>
          <StatusIndicator
            level={failedMailsCount > 0 ? "error" : "ok"}
            label={failedMailsCount > 0 ? labels.failedMailsWarning(failedMailsCount) : labels.failedMailsOk}
          />
        </Card>
      </li>

      <li>
        <Card className="flex flex-col gap-1">
          <p className="text-body-s opacity-60">{labels.futureWindowHeading}</p>
          <StatusIndicator
            level={hasFutureRecruitingWindow ? "ok" : "warning"}
            label={hasFutureRecruitingWindow ? labels.futureWindowOk : labels.futureWindowWarning}
          />
        </Card>
      </li>

      <li>
        <Card className="flex flex-col gap-1">
          <p className="text-body-s opacity-60">{labels.cronHeading}</p>
          <StatusIndicator
            level={cronStale ? "error" : "ok"}
            label={
              cronStale
                ? cronLastRunAt
                  ? labels.cronStaleLabel(dateFormatter.format(cronLastRunAt))
                  : labels.cronNeverRan
                : labels.cronOk(dateFormatter.format(cronLastRunAt!))
            }
          />
        </Card>
      </li>

      <li>
        <Card className="flex flex-col gap-1">
          <p className="text-body-s opacity-60">{labels.nextEventHeading}</p>
          {nextEvent ? (
            <>
              <p className="text-body-m font-medium">{nextEvent.title}</p>
              <p className="text-body-s opacity-60">{nextEvent.date}</p>
            </>
          ) : (
            <StatusIndicator level="neutral" label={labels.nextEventEmpty} />
          )}
        </Card>
      </li>
    </ul>
  );
}
