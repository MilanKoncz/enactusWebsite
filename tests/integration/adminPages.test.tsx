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
const listJobPostings = vi.fn();
const listFailedMails = vi.fn();
const listCronRuns = vi.fn();
const listRecruitingWindows = vi.fn();
const countFutureRecruitingWindows = vi.fn();
const listIdeathonSignups = vi.fn();
const listReminderSignups = vi.fn();
const cookieGet = vi.fn();

vi.mock("@/lib/db", () => ({
  listApplications: (...args: unknown[]) => listApplications(...args),
  listCalendarEvents: (...args: unknown[]) => listCalendarEvents(...args),
  listJobPostings: (...args: unknown[]) => listJobPostings(...args),
  listFailedMails: (...args: unknown[]) => listFailedMails(...args),
  listCronRuns: (...args: unknown[]) => listCronRuns(...args),
  listRecruitingWindows: (...args: unknown[]) => listRecruitingWindows(...args),
  countFutureRecruitingWindows: (...args: unknown[]) => countFutureRecruitingWindows(...args),
  listIdeathonSignups: (...args: unknown[]) => listIdeathonSignups(...args),
  listReminderSignups: (...args: unknown[]) => listReminderSignups(...args),
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
  listJobPostings.mockResolvedValue([]);
  listFailedMails.mockResolvedValue([]);
  listCronRuns.mockResolvedValue([]);
  listRecruitingWindows.mockResolvedValue([]);
  countFutureRecruitingWindows.mockResolvedValue(0);
  listIdeathonSignups.mockResolvedValue([]);
  listReminderSignups.mockResolvedValue([]);
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
    // renderWithIntl, not render: the row now carries an AdminDeleteButton,
    // a "use client" component that calls useTranslations and throws
    // without a provider — the same reason /admin/termine and /admin/jobs
    // below already need it for their own client components.
    renderWithIntl(await Page({ params: params() }));

    expect(listApplications).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Jäne Döe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "HWS26" })).toBeInTheDocument();
  });

  it("offers a per-semester CSV link only once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listApplications.mockResolvedValue([APPLICATION]);

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    renderWithIntl(await Page({ params: params() }));

    const link = screen.getByRole("link", { name: "Als CSV herunterladen" });
    expect(link).toHaveAttribute("href", "/api/admin/bewerbungen/csv?semester=HWS26");
  });

  it("offers a delete action per application once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listApplications.mockResolvedValue([APPLICATION]);

    const { default: Page } = await import("@/app/[locale]/admin/bewerbungen/page");
    renderWithIntl(await Page({ params: params() }));

    expect(screen.getByRole("button", { name: "Löschen" })).toBeInTheDocument();
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
  internalLink: null,
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

const JOB_POSTING = {
  id: "33333333-3333-3333-3333-333333333333",
  company: "SZA",
  title: "Werkstudent Consulting",
  employmentType: "werkstudent" as const,
  location: "Mannheim",
  remote: "hybrid" as const,
  description: null,
  applyUrl: "https://example.com/jobs/1",
  expiresAt: "2099-01-01",
  partnerSlug: null,
  createdAt: new Date("2026-08-01T10:00:00Z"),
  updatedAt: new Date("2026-08-01T10:00:00Z"),
};

describe("/admin/jobs (page)", () => {
  it("never reads job postings from the database without a session cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const { default: Page } = await import("@/app/[locale]/admin/jobs/page");
    await Page({ params: params() });

    expect(listJobPostings).not.toHaveBeenCalled();
  });

  it("renders the password prompt, not posting data, without a session", async () => {
    cookieGet.mockReturnValue(undefined);
    listJobPostings.mockResolvedValue([JOB_POSTING]);

    const { default: Page } = await import("@/app/[locale]/admin/jobs/page");
    const tree = await Page({ params: params() });

    expect(JSON.stringify(tree)).not.toContain("Werkstudent Consulting");
  });

  it("reads and renders posting data with a valid session", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listJobPostings.mockResolvedValue([JOB_POSTING]);

    const { default: Page } = await import("@/app/[locale]/admin/jobs/page");
    renderWithIntl(await Page({ params: params() }));

    expect(listJobPostings).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Werkstudent Consulting")).toBeInTheDocument();
  });
});

const IDEATHON_SIGNUP = {
  id: "44444444-4444-4444-4444-444444444444",
  createdAt: new Date("2026-08-25T16:05:52Z"),
  firstName: "Jäne",
  lastName: "Döe",
  email: "jane@example.com",
  studyProgram: "Social Entrepreneurship",
  hasIdea: true,
  registeringAsTeam: false,
  teamSize: undefined,
  teamMembers: undefined,
  motivationExperience: undefined,
  dietaryPreference: "vegan" as const,
  mailStatus: "sent" as const,
};

// The gap Phase 1 of the recruiting-release audit found: /admin/bewerbungen,
// /admin/termine, and /admin/jobs each had a page test above, but
// /admin/ideathon-anmeldungen — added in the same commit as those siblings'
// CSV routes — never got one, for either the page or the CSV route (the CSV
// route's own gap is closed in adminIdeathonCsv.test.ts). Also the page most
// likely to regress silently: it's the one this recruiting-release pass
// found broken by a migration that had never been applied to production.
describe("/admin/ideathon-anmeldungen (page)", () => {
  it("never reads signups from the database without a session cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const { default: Page } = await import("@/app/[locale]/admin/ideathon-anmeldungen/page");
    await Page({ params: params() });

    expect(listIdeathonSignups).not.toHaveBeenCalled();
  });

  it("renders the password prompt, not signup data, without a session", async () => {
    cookieGet.mockReturnValue(undefined);
    listIdeathonSignups.mockResolvedValue([IDEATHON_SIGNUP]);

    const { default: Page } = await import("@/app/[locale]/admin/ideathon-anmeldungen/page");
    const tree = await Page({ params: params() });

    expect(JSON.stringify(tree)).not.toContain("jane@example.com");
  });

  it("reads and renders signup data with a valid session, including the post-0015 fields", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listIdeathonSignups.mockResolvedValue([IDEATHON_SIGNUP]);

    const { default: Page } = await import("@/app/[locale]/admin/ideathon-anmeldungen/page");
    // renderWithIntl, not render: the row now carries an AdminDeleteButton,
    // a "use client" component that needs a NextIntlClientProvider.
    renderWithIntl(await Page({ params: params() }));

    expect(listIdeathonSignups).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Jäne Döe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Social Entrepreneurship")).toBeInTheDocument();
  });

  it("offers the CSV download link only once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listIdeathonSignups.mockResolvedValue([IDEATHON_SIGNUP]);

    const { default: Page } = await import("@/app/[locale]/admin/ideathon-anmeldungen/page");
    renderWithIntl(await Page({ params: params() }));

    const link = screen.getByRole("link", { name: "Als CSV herunterladen" });
    expect(link).toHaveAttribute("href", "/api/admin/ideathon-anmeldungen/csv");
  });

  it("offers a delete action per signup once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listIdeathonSignups.mockResolvedValue([IDEATHON_SIGNUP]);

    const { default: Page } = await import("@/app/[locale]/admin/ideathon-anmeldungen/page");
    renderWithIntl(await Page({ params: params() }));

    expect(screen.getByRole("button", { name: "Löschen" })).toBeInTheDocument();
  });
});

const REMINDER_SIGNUP = {
  id: "55555555-5555-5555-5555-555555555555",
  createdAt: new Date("2026-08-20T12:00:00Z"),
  email: "jane@example.com",
  confirmed: true,
  confirmedAt: new Date("2026-08-20T12:05:00Z"),
  unsubscribedAt: null,
  mailStatus: "sent" as const,
};

// Another gap Phase 1 of the recruiting-release audit found: unlike
// /admin/bewerbungen, /admin/termine, and /admin/jobs, this page never had
// a page-level test at all — only its CSV route did
// (adminReminderCsv.test.ts). It gained its first mutation (delete) in the
// same pass that added this test.
describe("/admin/erinnerungen (page)", () => {
  it("never reads signups from the database without a session cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const { default: Page } = await import("@/app/[locale]/admin/erinnerungen/page");
    await Page({ params: params() });

    expect(listReminderSignups).not.toHaveBeenCalled();
  });

  it("renders the password prompt, not signup data, without a session", async () => {
    cookieGet.mockReturnValue(undefined);
    listReminderSignups.mockResolvedValue([REMINDER_SIGNUP]);

    const { default: Page } = await import("@/app/[locale]/admin/erinnerungen/page");
    const tree = await Page({ params: params() });

    expect(JSON.stringify(tree)).not.toContain("jane@example.com");
  });

  it("reads and renders signup data with a valid session", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listReminderSignups.mockResolvedValue([REMINDER_SIGNUP]);

    const { default: Page } = await import("@/app/[locale]/admin/erinnerungen/page");
    renderWithIntl(await Page({ params: params() }));

    expect(listReminderSignups).toHaveBeenCalledTimes(1);
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("offers the CSV download link and a delete action once authenticated", async () => {
    cookieGet.mockReturnValue({ value: await validSessionCookie() });
    listReminderSignups.mockResolvedValue([REMINDER_SIGNUP]);

    const { default: Page } = await import("@/app/[locale]/admin/erinnerungen/page");
    renderWithIntl(await Page({ params: params() }));

    const link = screen.getByRole("link", { name: "Als CSV herunterladen" });
    expect(link).toHaveAttribute("href", "/api/admin/erinnerungen/csv");
    expect(screen.getByRole("button", { name: "Löschen" })).toBeInTheDocument();
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
