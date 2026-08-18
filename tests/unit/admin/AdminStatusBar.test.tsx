import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import type { AdminStatusBarProps } from "@/components/admin/AdminStatusBar";

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

const LABELS: AdminStatusBarProps["labels"] = {
  applicationsHeading: "Bewerbungen im laufenden Fenster",
  applicationsNoWindow: "Kein Fenster offen",
  failedMailsHeading: "Fehlgeschlagene Mails",
  failedMailsOk: "Alle zugestellt",
  failedMailsWarning: (count) => `${count} zu prüfen`,
  futureWindowHeading: "Nächstes Bewerbungsfenster",
  futureWindowOk: "Eingetragen",
  futureWindowWarning: "Noch nicht eingetragen",
  cronHeading: "Löschroutine",
  cronOk: (when) => `Zuletzt am ${when}`,
  cronNeverRan: "Noch nie gelaufen",
  cronStaleLabel: (when) => `Seit ${when} nicht mehr gelaufen`,
  nextEventHeading: "Nächster Termin",
  nextEventEmpty: "Keine Termine eingetragen",
};

const HEALTHY: AdminStatusBarProps = {
  applicationsInWindow: { count: 12, semester: "HWS26" },
  failedMailsCount: 0,
  hasFutureRecruitingWindow: true,
  cronStale: false,
  cronLastRunAt: new Date("2026-08-17T03:00:00Z"),
  nextEvent: { title: "Initiativenmarkt", date: "1. September 2026" },
  labels: LABELS,
  dateFormatter,
};

describe("AdminStatusBar", () => {
  it("shows the application count and semester when a window is open", () => {
    render(<AdminStatusBar {...HEALTHY} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("HWS26")).toBeInTheDocument();
  });

  it("shows a neutral message instead of a count when no window is open", () => {
    render(<AdminStatusBar {...HEALTHY} applicationsInWindow={null} />);
    expect(screen.getByText("Kein Fenster offen")).toBeInTheDocument();
  });

  it("reads failed mails as ok in green when there are none", () => {
    render(<AdminStatusBar {...HEALTHY} failedMailsCount={0} />);
    const label = screen.getByText("Alle zugestellt");
    expect(label.closest(".text-moss")).toBeInTheDocument();
  });

  it("reads failed mails as an error in red when there are some", () => {
    render(<AdminStatusBar {...HEALTHY} failedMailsCount={3} />);
    const label = screen.getByText("3 zu prüfen");
    expect(label.closest(".text-oxblood")).toBeInTheDocument();
  });

  it("warns in amber when no future recruiting window is scheduled", () => {
    render(<AdminStatusBar {...HEALTHY} hasFutureRecruitingWindow={false} />);
    const label = screen.getByText("Noch nicht eingetragen");
    expect(label.closest(".text-amber")).toBeInTheDocument();
  });

  it("shows the cron as ok in green when it isn't stale", () => {
    render(<AdminStatusBar {...HEALTHY} cronStale={false} />);
    const label = screen.getByText(/Zuletzt am/);
    expect(label.closest(".text-moss")).toBeInTheDocument();
  });

  it("shows the cron as an error in red when it's stale", () => {
    render(<AdminStatusBar {...HEALTHY} cronStale={true} />);
    const label = screen.getByText(/nicht mehr gelaufen/);
    expect(label.closest(".text-oxblood")).toBeInTheDocument();
  });

  it("shows 'never ran' when the cron has no successful run at all", () => {
    render(<AdminStatusBar {...HEALTHY} cronStale={true} cronLastRunAt={null} />);
    expect(screen.getByText("Noch nie gelaufen")).toBeInTheDocument();
  });

  it("shows the next event's title and date when one exists", () => {
    render(<AdminStatusBar {...HEALTHY} />);
    expect(screen.getByText("Initiativenmarkt")).toBeInTheDocument();
    expect(screen.getByText("1. September 2026")).toBeInTheDocument();
  });

  it("shows an empty message when no event is upcoming", () => {
    render(<AdminStatusBar {...HEALTHY} nextEvent={null} />);
    expect(screen.getByText("Keine Termine eingetragen")).toBeInTheDocument();
  });

  it("has no accessibility violations in either a healthy or an attention-needed state", async () => {
    const { container: healthy } = render(<AdminStatusBar {...HEALTHY} />);
    expect(await axe(healthy)).toHaveNoViolations();

    const { container: needsAttention } = render(
      <AdminStatusBar
        {...HEALTHY}
        applicationsInWindow={null}
        failedMailsCount={2}
        hasFutureRecruitingWindow={false}
        cronStale={true}
        nextEvent={null}
      />,
    );
    expect(await axe(needsAttention)).toHaveNoViolations();
  });
});
