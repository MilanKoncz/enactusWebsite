import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { MitmachenApplication } from "@/components/sections/MitmachenApplication";
import type { RecruitingWindow } from "@/content/recruiting";

const hws26: RecruitingWindow = {
  semester: "HWS26",
  start: "2026-09-01T00:00:00+02:00",
  end: "2026-09-13T23:59:00+02:00",
};
const opensMs = new Date(hws26.start).getTime();
const closesMs = new Date(hws26.end).getTime();

function freezeNowAt(ms: number) {
  vi.spyOn(Date, "now").mockImplementation(() => ms);
}

describe("MitmachenApplication", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the countdown and reminder sign-up before the window opens", () => {
    freezeNowAt(opensMs - 10_000);
    renderWithIntl(<MitmachenApplication recruitingWindows={[hws26]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Per E-Mail erinnern lassen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("shows the real application form once the window is open", () => {
    freezeNowAt((opensMs + closesMs) / 2);
    renderWithIntl(<MitmachenApplication recruitingWindows={[hws26]} />);

    expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    expect(screen.queryByText("Das Bewerbungsfenster ist noch geschlossen")).not.toBeInTheDocument();
  });

  it("shows a closed message without a countdown once the window has passed", () => {
    freezeNowAt(closesMs + 10_000);
    renderWithIntl(<MitmachenApplication recruitingWindows={[hws26]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist für diesen Zyklus geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Per E-Mail erinnern lassen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("shows a closed message without a countdown when no window is scheduled at all", () => {
    freezeNowAt(opensMs);
    renderWithIntl(<MitmachenApplication recruitingWindows={[]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Per E-Mail erinnern lassen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations while closed", async () => {
    freezeNowAt(opensMs - 10_000);
    const { container } = renderWithIntl(<MitmachenApplication recruitingWindows={[hws26]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations while open", async () => {
    freezeNowAt((opensMs + closesMs) / 2);
    const { container } = renderWithIntl(<MitmachenApplication recruitingWindows={[hws26]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
