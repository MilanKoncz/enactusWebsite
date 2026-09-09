import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../../fixtures/intl";
import { nextNavigationMock } from "../../fixtures/navigation";
import { ProjectAreasManager } from "@/components/admin/ProjectAreasManager";
import { DepartmentsManager } from "@/components/admin/DepartmentsManager";
import { JobPostingsManager } from "@/components/admin/JobPostingsManager";
import { CalendarEventsManager } from "@/components/admin/CalendarEventsManager";
import { RecruitingWindowsManager } from "@/components/admin/RecruitingWindowsManager";

vi.mock("next/navigation", () => nextNavigationMock);

/**
 * The actual, measured cause of the row-action misalignment
 * (`AdminRowActions.tsx`'s own comment has the numbers): the toggle button's
 * own label changes width between "Aktivieren" and "Deaktivieren", and every
 * button after it in the same flex row inherits the shift. These tests
 * assert the fix at the DOM level — both the current and the reserved
 * alternate label exist for every toggle, regardless of which row's state
 * put it there — rather than re-measuring pixels, which jsdom can't do.
 */
describe("admin manager row actions, aligned regardless of toggle state", () => {
  it("ProjectAreasManager reserves both toggle labels for an active and an inactive row alike", () => {
    renderWithIntl(
      <ProjectAreasManager
        areas={[
          { id: "a1", labelDe: "SmileGreen", labelEn: "SmileGreen", sortOrder: 1, active: true, ideathonHint: false },
          { id: "a2", labelDe: "Mealyo", labelEn: "Mealyo", sortOrder: 2, active: false, ideathonHint: false },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Deaktivieren" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aktivieren" })).toBeInTheDocument();
    // Both rows carry the reserved-but-hidden alternate label too — the
    // mechanism that keeps the button's own width constant across states.
    expect(screen.getAllByText("Aktivieren", { selector: "[aria-hidden]" })).toHaveLength(1);
    expect(screen.getAllByText("Deaktivieren", { selector: "[aria-hidden]" })).toHaveLength(1);
  });

  // The admin UI itself only ever renders in German (proxy.ts 404s
  // /en/admin/*, deliberately — see its own comment), so there is no live
  // page to browser-measure in English. What the fix actually needs to hold
  // up against is a longer translation changing the reserved width, and
  // that's testable without a route: render the same component with the
  // real English strings from messages/en.json and confirm both are still
  // reserved. Guards the mechanism, not a reachable URL.
  it("reserves both toggle labels for the English string set too, even with no live English admin route", () => {
    renderWithIntl(
      <ProjectAreasManager
        areas={[
          { id: "a1", labelDe: "SmileGreen", labelEn: "SmileGreen", sortOrder: 1, active: true, ideathonHint: false },
          { id: "a2", labelDe: "Mealyo", labelEn: "Mealyo", sortOrder: 2, active: false, ideathonHint: false },
        ]}
      />,
      { locale: "en" },
    );

    expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
    expect(screen.getAllByText("Activate", { selector: "[aria-hidden]" })).toHaveLength(1);
    expect(screen.getAllByText("Deactivate", { selector: "[aria-hidden]" })).toHaveLength(1);
  });

  it("DepartmentsManager reserves both toggle labels the same way", () => {
    renderWithIntl(
      <DepartmentsManager
        departments={[
          { id: "d1", labelDe: "IT Team", labelEn: "IT Team", sortOrder: 1, active: true },
          { id: "d2", labelDe: "Relations", labelEn: "Relations", sortOrder: 2, active: false },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Deaktivieren" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aktivieren" })).toBeInTheDocument();
    expect(screen.getAllByText("Aktivieren", { selector: "[aria-hidden]" })).toHaveLength(1);
    expect(screen.getAllByText("Deaktivieren", { selector: "[aria-hidden]" })).toHaveLength(1);
  });

  it("every manager's action cell uses the one shared AdminRowActions wrapper", () => {
    const now = Date.now();
    const managers = [
      renderWithIntl(
        <ProjectAreasManager
          areas={[{ id: "a1", labelDe: "SmileGreen", labelEn: "SmileGreen", sortOrder: 1, active: true, ideathonHint: false }]}
        />,
      ),
      renderWithIntl(
        <DepartmentsManager
          departments={[{ id: "d1", labelDe: "IT Team", labelEn: "IT Team", sortOrder: 1, active: true }]}
        />,
      ),
      renderWithIntl(
        <JobPostingsManager
          now={now}
          jobs={[
            {
              id: "j1",
              company: "Acme",
              title: "Werkstudent",
              employmentType: "werkstudent",
              location: "Mannheim",
              remote: "vor_ort",
              description: null,
              applyUrl: "https://example.com",
              expiresAt: "2099-01-01",
              partnerSlug: null,
            },
          ]}
        />,
      ),
      renderWithIntl(
        <CalendarEventsManager
          events={[
            {
              id: "c1",
              title: "Ideathon",
              titleEn: null,
              category: "innolab",
              startDate: "2099-01-01",
              endDate: null,
              startTime: null,
              endTime: null,
              location: null,
              description: null,
              descriptionEn: null,
              tentative: false,
              internalLink: null,
            },
          ]}
        />,
      ),
      renderWithIntl(
        <RecruitingWindowsManager
          windows={[
            {
              id: "w1",
              semester: "HWS26",
              start: "2026-09-01T00:00:00.000Z",
              end: "2026-09-30T00:00:00.000Z",
              startWallClock: "2026-09-01T00:00",
              endWallClock: "2026-09-30T00:00",
              interviewDays: [],
              interviewStartTime: "10:00",
              interviewEndTime: "19:00",
              interviewSlotMinutes: 60,
            },
          ]}
        />,
      ),
    ];

    for (const { container } of managers) {
      const table = container.querySelector("table");
      expect(table).not.toBeNull();
      const actionCell = table!.querySelectorAll("tbody td")[table!.querySelectorAll("thead th").length - 1];
      const wrapper = actionCell.firstElementChild;
      expect(wrapper).toHaveClass("flex", "flex-wrap", "items-center", "gap-2");
    }
  });
});
