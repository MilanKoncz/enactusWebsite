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
    renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Benachrichtigung zum Bewerbungsstart")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("shows the WhatsApp community line while the window is closed, below the reminder sign-up", () => {
    freezeNowAt(opensMs - 10_000);
    renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);

    const link = screen.getByRole("link", { name: "WhatsApp-Community" });
    expect(link).toHaveAttribute("href", "https://chat.whatsapp.com/FplqECI7eYL2CmoxR2OR2Q");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));

    const reminderHeading = screen.getByText("Benachrichtigung zum Bewerbungsstart");
    expect(
      reminderHeading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows the WhatsApp community line once the window is open, below the application form", () => {
    freezeNowAt((opensMs + closesMs) / 2);
    renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);

    const link = screen.getByRole("link", { name: "WhatsApp-Community" });
    expect(link).toHaveAttribute("href", "https://chat.whatsapp.com/FplqECI7eYL2CmoxR2OR2Q");

    const submitButton = screen.getByRole("button", { name: "Bewerbung absenden" });
    expect(
      submitButton.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  // Regression coverage for the timezone bug: the sentence used to be
  // rendered with no explicit timeZone, so it silently followed the host
  // machine's own zone instead of Europe/Berlin — the exact bug the
  // "Berliner Zeit" note right underneath it was supposed to rule out. None
  // of the tests above ever looked at the actual date text, which is why
  // the bug shipped unnoticed. hws26.start/.end are stored with an explicit
  // +02:00 offset, so this also proves the offset is honoured, not just the
  // zone name.
  describe("renders the opening and closing dates in Berlin time", () => {
    const originalTz = process.env.TZ;

    afterEach(() => {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    });

    it.each(["Asia/Seoul", "America/New_York", "Europe/Berlin"])(
      "with the host machine set to %s",
      (hostTimeZone) => {
        process.env.TZ = hostTimeZone;
        freezeNowAt(opensMs - 10_000);
        renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);

        expect(
          screen.getByText(
            "Bewerbungen sind vom 1. September 2026 um 00:00 bis 13. September 2026 um 23:59 möglich. Lass dich per E-Mail benachrichtigen, sobald es losgeht.",
          ),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Alle Zeiten in Berliner Zeit (Europe/Berlin), unabhängig davon, wo du gerade bist."),
        ).toBeInTheDocument();
        expect(screen.getByText("Bewerbungen öffnen am 1. September 2026 um 00:00.")).toBeInTheDocument();
      },
    );
  });

  it("shows the real application form once the window is open", () => {
    freezeNowAt((opensMs + closesMs) / 2);
    renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);

    expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    expect(screen.queryByText("Das Bewerbungsfenster ist noch geschlossen")).not.toBeInTheDocument();
  });

  it("shows a closed message without a countdown once the window has passed", () => {
    freezeNowAt(closesMs + 10_000);
    renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist für diesen Zyklus geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Benachrichtigung zum Bewerbungsstart")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("shows a closed message without a countdown when no window is scheduled at all", () => {
    freezeNowAt(opensMs);
    renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[]} />);

    expect(screen.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeInTheDocument();
    expect(screen.getByText("Benachrichtigung zum Bewerbungsstart")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bewerbung absenden" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations while closed", async () => {
    freezeNowAt(opensMs - 10_000);
    const { container } = renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations while open", async () => {
    freezeNowAt((opensMs + closesMs) / 2);
    const { container } = renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[hws26]} />);
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
    renderWithIntl(<MitmachenApplication projectAreas={[]} departments={[]} recruitingWindows={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    });
  });
});
