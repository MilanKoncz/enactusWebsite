import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
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
  beforeEach(() => {
    // The component re-fetches its own data on mount (GET
    // /api/recruiting-windows) — rejecting it here keeps every test below
    // on the `recruitingWindows` prop it explicitly passes in, exactly as
    // before this fetch existed. The one test that cares about a
    // successful refresh overrides this itself.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no network in tests")));
    // jsdom has no matchMedia; ApplicationForm (rendered here once the
    // window is open) reads prefers-reduced-motion for its confetti burst,
    // so every test needs some stub in place.
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the countdown and reminder sign-up before the window opens", () => {
    freezeNowAt(opensMs - 10_000);
    renderWithIntl(<MitmachenApplication projectAreas={[]} recruitingWindows={[hws26]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Benachrichtigung zum Bewerbungsstart")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("shows the real application form once the window is open", () => {
    freezeNowAt((opensMs + closesMs) / 2);
    renderWithIntl(<MitmachenApplication projectAreas={[]} recruitingWindows={[hws26]} />);

    expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    expect(screen.queryByText("Das Bewerbungsfenster ist noch geschlossen")).not.toBeInTheDocument();
  });

  it("shows a closed message without a countdown once the window has passed", () => {
    freezeNowAt(closesMs + 10_000);
    renderWithIntl(<MitmachenApplication projectAreas={[]} recruitingWindows={[hws26]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist für diesen Zyklus geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Benachrichtigung zum Bewerbungsstart")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("shows a closed message without a countdown when no window is scheduled at all", () => {
    freezeNowAt(opensMs);
    renderWithIntl(<MitmachenApplication projectAreas={[]} recruitingWindows={[]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Benachrichtigung zum Bewerbungsstart")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations while closed", async () => {
    freezeNowAt(opensMs - 10_000);
    const { container } = renderWithIntl(<MitmachenApplication projectAreas={[]} recruitingWindows={[hws26]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations while open", async () => {
    freezeNowAt((opensMs + closesMs) / 2);
    const { container } = renderWithIntl(<MitmachenApplication projectAreas={[]} recruitingWindows={[hws26]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("prefers a freshly fetched window list over the initial prop once it arrives", async () => {
    freezeNowAt((opensMs + closesMs) / 2);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ windows: [hws26] }), { status: 200 })),
    );
    // Starts closed (empty prop) — the open state only appears once the
    // mocked fetch resolves and the component adopts its result.
    renderWithIntl(<MitmachenApplication projectAreas={[]} recruitingWindows={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    });
  });
});
