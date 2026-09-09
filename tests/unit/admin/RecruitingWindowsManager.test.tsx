import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../fixtures/intl";
import { RecruitingWindowsManager, type ManagedWindow } from "@/components/admin/RecruitingWindowsManager";

vi.mock("next/navigation", async () => (await import("../../fixtures/navigation")).nextNavigationMock);

const WINDOW_WITH_GRID: ManagedWindow = {
  id: "w1",
  semester: "HWS26",
  start: "2026-08-31T22:00:00.000Z",
  end: "2026-09-13T21:59:00.000Z",
  startWallClock: "2026-09-01T00:00",
  endWallClock: "2026-09-13T23:59",
  interviewDays: ["2026-09-15", "2026-09-16"],
  interviewStartTime: "10:00",
  interviewEndTime: "19:00",
  interviewSlotMinutes: 60,
};

const WINDOW_WITHOUT_GRID: ManagedWindow = {
  ...WINDOW_WITH_GRID,
  id: "w2",
  semester: "FSS27",
  interviewDays: [],
};

describe("RecruitingWindowsManager — interview grid", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the configured interview grid summary in the table", () => {
    renderWithIntl(<RecruitingWindowsManager windows={[WINDOW_WITH_GRID]} />);
    expect(screen.getByText("2 Tage, 10:00 bis 19:00 Uhr, 60 Min., 18 Slots")).toBeInTheDocument();
  });

  it("shows 'keine' for a window with no interview days configured", () => {
    renderWithIntl(<RecruitingWindowsManager windows={[WINDOW_WITHOUT_GRID]} />);
    expect(screen.getByText("keine")).toBeInTheDocument();
  });

  it("pre-fills the edit form's interview grid when editing an existing window", async () => {
    const user = userEvent.setup();
    renderWithIntl(<RecruitingWindowsManager windows={[WINDOW_WITH_GRID]} />);

    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));

    expect(screen.getByLabelText("Gesprächstag 1")).toHaveValue("2026-09-15");
    expect(screen.getByLabelText("Gesprächstag 2")).toHaveValue("2026-09-16");
    expect(screen.getByLabelText("Slotlänge (Minuten)")).toHaveValue(60);
  });

  it("adds and removes an interview day, updating the live slot count", async () => {
    const user = userEvent.setup();
    renderWithIntl(<RecruitingWindowsManager windows={[]} />);

    expect(screen.getByText("Ergibt 0 Zeitfenster (0 je Tag).")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tag hinzufügen" }));
    await user.type(screen.getByLabelText("Gesprächstag 1"), "2026-09-15");

    expect(screen.getByText("Ergibt 9 Zeitfenster (9 je Tag).")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gesprächstag 1 entfernen" }));
    expect(screen.queryByLabelText("Gesprächstag 1")).not.toBeInTheDocument();
    expect(screen.getByText("Ergibt 0 Zeitfenster (0 je Tag).")).toBeInTheDocument();
  });

  it("sends the interview grid on create", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ ok: true, window: WINDOW_WITH_GRID }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithIntl(<RecruitingWindowsManager windows={[]} />);

    await user.type(screen.getByLabelText("Semester"), "HWS26");
    await user.type(screen.getByLabelText("Beginn"), "2026-09-01T00:00");
    await user.type(screen.getByLabelText("Ende"), "2026-09-13T23:59");
    await user.click(screen.getByRole("button", { name: "Tag hinzufügen" }));
    await user.type(screen.getByLabelText("Gesprächstag 1"), "2026-09-15");
    await user.click(screen.getByRole("button", { name: "Anlegen" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/bewerbungsfenster",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"interviewDays":["2026-09-15"]'),
      }),
    );
  });

  it("has no accessibility violations with the interview fieldset expanded", async () => {
    const { axe } = await import("jest-axe");
    const { container } = renderWithIntl(<RecruitingWindowsManager windows={[WINDOW_WITH_GRID]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
