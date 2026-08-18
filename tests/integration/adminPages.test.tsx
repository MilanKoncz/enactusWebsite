import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithIntl } from "../fixtures/intl";

/**
 * Closes the one gap REVIEW.md found in the test suite: every existing
 * admin test covered the CSV *route*, none covered the *page*. The
 * load-bearing assertion here isn't "no data is visible" — it's that the
 * database function was never called at all, so an unauthenticated request
 * can't be answered with data that merely happens to be hidden.
 */
const listApplications = vi.fn();
const listCalendarEvents = vi.fn();
const listFailedMails = vi.fn();
const listCronRuns = vi.fn();
const listRecruitingWindows = vi.fn();
const countFutureRecruitingWindows = vi.fn();
const cookieGet = vi.fn();

vi.mock("@/lib/db", () => ({
  listApplications: (...args: unknown[]) => listApplications(...args),
  listCalendarEvents: (...args: unknown[]) => listCalendarEvents(...args),
  listFailedMails: (...args: unknown[]) => listFailedMails(...args),
  listCronRuns: (...args: unknown[]) => listCronRuns(...args),
  listRecruitingWindows: (...args: unknown[]) => listRecruitingWindows(...args),
  countFutureRecruitingWindows: (...args: unknown[]) => countFutureRecruitingWindows(...args),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => cookieGet(name) }),
}));

vi.mock("next-intl/server", async () => (await import("../fixtures/nextIntlServer")).nextIntlServerMock);

vi.mock("@/i18n/requireLocale", () => ({
  requireLocale: async () => "de",
  resolveLocale: (locale: string) => (locale === "en" ? "en" : "de"),
}));

// Only CalendarEventsManager (rendered by /admin/termine) needs this — it's
// a "use client" component that calls next/navigation's useRouter, which
// has no App Router context in these direct Page({params}) renders.
vi.mock("next/navigation", async () => (await import("../fixtures/navigation")).nextNavigationMock);

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

const APPLICATION = {
  id: "11111111-1111-1111-1111-111111111111",
  createdAt: new Date("2026-09-05T10:00:00Z"),
  firstName: "Jäne",
  lastName: "Döe",
  email: "jane@example.com",
  studyProgram: "BWL",
  mailStatus: "sent" as const,
  recruitingSemester: "HWS26",
};

function params() {
  return Promise.resolve({ locale: "de" });
}

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-page-tests";
  // Sensible empty defaults for the overview page's status bar — only the
  // tests that actually assert on these values override them.
  listApplications.mockResolvedValue([]);
  listCalendarEvents.mockResolvedValue([]);
  listFailedMails.mockResolvedValue([]);
  listCronRuns.mockResolvedValue([]);
  listRecruitingWindows.mockResolvedValue([]);
  countFutureRecruitingWindows.mockResolvedValue(0);
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function validSessionCookie() {
  const { createSessionCookieValue } = await import("@/lib/adminAuth");
  return createSessionCookieValue()!;
}

describe("/admin/bewerbungen (page)", () => {
  it("never reads applications from the database without a session cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    await Page({ params: params() });

    expect(listApplications).not.toHaveBeenCalled();
  });

  it("never reads applications when the session cookie is present but forged", async () => {
    cookieGet.mockReturnValue({ value: `${Date.now() + 60_000}.deadbeef` });

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    await Page({ params: params() });

    expect(listApplications).not.toHaveBeenCalled();
  });

  it("never reads applications when the session cookie has expired", async () => {
    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    const longExpired = createSessionCookieValue(new Date("2020-01-01T00:00:00Z"))!;
    cookieGet.mockReturnValue({ value: longExpired });

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    await Page({ params: params() });

    expect(listApplications).not.toHaveBeenCalled();
  });

  it("renders the password prompt, not applicant data, without a session", async () => {
    cookieGet.mockReturnValue(undefined);
    listApplications.mockResolvedValue([APPLICATION]);

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    const tree = await Page({ params: params() });
    // AdminLogin is itself an async server component, so what's asserted
    // here is the returned element — rendering it would need a Suspense
    // boundary this test has no reason to build.
    expect(JSON.stringify(tree)).not.toContain("jane@example.com");
    expect(JSON.stringify(tree)).not.toContain("Döe");
  });

  it("reads and renders applicant data with a valid session", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listApplications.mockResolvedValue([APPLICATION]);

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    render(await Page({ params: params() }));

    expect(listApplications).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Jäne Döe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "HWS26" })).toBeInTheDocument();
  });

  it("offers a per-semester CSV link only once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listApplications.mockResolvedValue([APPLICATION]);

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    render(await Page({ params: params() }));

    const link = screen.getByRole("link", { name: "Als CSV herunterladen" });
    expect(link).toHaveAttribute("href", "/api/admin/bewerbungen/csv?semester=HWS26");
  });
});

const CALENDAR_EVENT = {
  id: "22222222-2222-2222-2222-222222222222",
  title: "Ideathon",
  titleEn: null,
  category: "innolab" as const,
  startDate: "2026-09-24",
  endDate: "2026-09-27",
  startTime: null,
  endTime: null,
  location: null,
  description: null,
  descriptionEn: null,
  tentative: false,
  createdAt: new Date("2026-08-01T10:00:00Z"),
  updatedAt: new Date("2026-08-01T10:00:00Z"),
};

describe("/admin/termine (page)", () => {
  it("never reads calendar events from the database without a session cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const { default: Page } = await import("@/app/[locale]/admin/termine/page");
    await Page({ params: params() });

    expect(listCalendarEvents).not.toHaveBeenCalled();
  });

  it("renders the password prompt, not event data, without a session", async () => {
    cookieGet.mockReturnValue(undefined);
    listCalendarEvents.mockResolvedValue([CALENDAR_EVENT]);

    const { default: Page } = await import("@/app/[locale]/admin/termine/page");
    const tree = await Page({ params: params() });

    expect(JSON.stringify(tree)).not.toContain("Ideathon");
  });

  it("reads and renders event data with a valid session", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listCalendarEvents.mockResolvedValue([CALENDAR_EVENT]);

    const { default: Page } = await import("@/app/[locale]/admin/termine/page");
    // Unlike /admin/bewerbungen, this page's content is a "use client"
    // component (CalendarEventsManager) that calls next-intl's client
    // useTranslations — it needs a real provider, which the app's own root
    // layout supplies in production but this test bypasses by rendering
    // the page directly.
    renderWithIntl(await Page({ params: params() }));

    expect(listCalendarEvents).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Ideathon")).toBeInTheDocument();
  });
});

describe("/admin (overview page)", () => {
  it("renders the password prompt and no section links without a session", async () => {
    cookieGet.mockReturnValue(undefined);

    const { default: Page } = await import("@/app/[locale]/admin/page");
    const tree = await Page({ params: params() });

    expect(JSON.stringify(tree)).not.toContain("/admin/loeschanfragen");
    expect(listApplications).not.toHaveBeenCalled();
    expect(listFailedMails).not.toHaveBeenCalled();
  });

  it("links every admin section once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });

    const { default: Page } = await import("@/app/[locale]/admin/page");
    render(await Page({ params: params() }));

    const { ADMIN_SECTIONS } = await import("@/components/admin/adminSections");
    for (const section of ADMIN_SECTIONS) {
      const links = screen.getAllByRole("link");
      const hrefs = links.map((link) => link.getAttribute("href"));
      expect(hrefs).toContain(section.href);
      const link = links.find((candidate) => candidate.getAttribute("href") === section.href)!;
      expect(link.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("shows the status bar's real figures once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listApplications.mockResolvedValue([
      { ...APPLICATION, recruitingSemester: "HWS26" },
      { ...APPLICATION, id: "2", recruitingSemester: "HWS26" },
    ]);
    listFailedMails.mockResolvedValue([{ source: "applications", id: "1" }]);
    listRecruitingWindows.mockResolvedValue([
      { id: "w1", semester: "HWS26", start: "2000-01-01T00:00:00Z", end: "2099-01-01T00:00:00Z" },
    ]);
    countFutureRecruitingWindows.mockResolvedValue(0);
    listCronRuns.mockResolvedValue([]);
    listCalendarEvents.mockResolvedValue([]);

    const { default: Page } = await import("@/app/[locale]/admin/page");
    render(await Page({ params: params() }));

    // Two applications in the (mocked, always-open) HWS26 window.
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("HWS26")).toBeInTheDocument();
    // One failed mail, reported as needing attention.
    expect(screen.getByText("1 zu prüfen")).toBeInTheDocument();
    // No future window scheduled — the warning tier, not silently absent.
    expect(screen.getByText("Noch nicht eingetragen")).toBeInTheDocument();
  });
});
