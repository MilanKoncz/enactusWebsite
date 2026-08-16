import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { MitmachenApplication } from "@/components/sections/MitmachenApplication";
import { recruitingWindow } from "@/content/recruiting";

const opensMs = new Date(recruitingWindow.opensAt!).getTime();
const closesMs = new Date(recruitingWindow.closesAt!).getTime();

function freezeNowAt(ms: number) {
  vi.spyOn(Date, "now").mockImplementation(() => ms);
}

describe("MitmachenApplication", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the countdown and reminder sign-up before the window opens", () => {
    freezeNowAt(opensMs - 10_000);
    renderWithIntl(<MitmachenApplication />);

    expect(screen.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Per E-Mail erinnern lassen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("shows the real application form once the window is open", () => {
    freezeNowAt((opensMs + closesMs) / 2);
    renderWithIntl(<MitmachenApplication />);

    expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    expect(screen.queryByText("Das Bewerbungsfenster ist noch geschlossen")).not.toBeInTheDocument();
  });

  it("shows a closed message without a countdown once the window has passed", () => {
    freezeNowAt(closesMs + 10_000);
    renderWithIntl(<MitmachenApplication />);

    expect(screen.getByText("Das Bewerbungsfenster ist für diesen Zyklus geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Per E-Mail erinnern lassen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations while closed", async () => {
    freezeNowAt(opensMs - 10_000);
    const { container } = renderWithIntl(<MitmachenApplication />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations while open", async () => {
    freezeNowAt((opensMs + closesMs) / 2);
    const { container } = renderWithIntl(<MitmachenApplication />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
