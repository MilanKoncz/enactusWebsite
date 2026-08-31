import {
  Activity,
  BellRing,
  Boxes,
  Briefcase,
  CalendarDays,
  CalendarRange,
  FileText,
  Lightbulb,
  ListChecks,
  MailWarning,
  MessageSquare,
  Trash2,
} from "lucide-react";

/**
 * The four groups the sidebar nav (AdminNav.tsx) clusters sections under —
 * board feedback: nine items in one header row read as clutter. Order here
 * is the order groups render in; `AdminNav` renders the overview link
 * (not part of this list — see below) as the first item of `system`, since
 * it's the fourth of the board's named groups ("System: Übersicht,
 * Löschanfragen, Systemstatus").
 */
export const ADMIN_GROUPS = ["application", "communication", "content", "system"] as const;
export type AdminGroup = (typeof ADMIN_GROUPS)[number];

/**
 * The admin area's sections, in navigation order. One list, read by both
 * the layout's nav (AdminNav.tsx) and the overview page — so a new section
 * can't appear in one and be missing from the other, and so its icon can't
 * drift between the two either.
 *
 * `as const` is load-bearing, not decoration: `messageKey` has to be a
 * union of string literals rather than `string`, or next-intl's typed
 * `t()` rejects `t(\`nav.${section.messageKey}\`)` outright. That typing is
 * what makes a section added here without its matching entries under
 * `Admin.nav` and `Admin.overview.sections` a compile error instead of a
 * missing-message crash at runtime.
 *
 * Paths are literal and unprefixed: the admin area only ever answers at
 * /admin/... (proxy.ts 404s the /en-prefixed variant), so these are plain
 * hrefs for RawLink, not next-intl routes.
 */
export const ADMIN_SECTIONS = [
  { href: "/admin/bewerbungen", messageKey: "applications", icon: FileText, group: "application" },
  { href: "/admin/bewerbungsfenster", messageKey: "recruitingWindows", icon: CalendarRange, group: "application" },
  { href: "/admin/wunschbereiche", messageKey: "projectAreas", icon: ListChecks, group: "application" },
  { href: "/admin/ressorts", messageKey: "departments", icon: Boxes, group: "application" },
  { href: "/admin/erinnerungen", messageKey: "reminders", icon: BellRing, group: "application" },
  { href: "/admin/ideathon-anmeldungen", messageKey: "ideathonSignups", icon: Lightbulb, group: "application" },
  { href: "/admin/kontakt", messageKey: "contactMessages", icon: MessageSquare, group: "communication" },
  { href: "/admin/mails", messageKey: "failedMails", icon: MailWarning, group: "communication" },
  { href: "/admin/termine", messageKey: "calendarEvents", icon: CalendarDays, group: "content" },
  { href: "/admin/jobs", messageKey: "jobPostings", icon: Briefcase, group: "content" },
  { href: "/admin/loeschanfragen", messageKey: "deletionRequests", icon: Trash2, group: "system" },
  { href: "/admin/system", messageKey: "system", icon: Activity, group: "system" },
] as const satisfies ReadonlyArray<{
  href: string;
  messageKey: string;
  icon: unknown;
  group: AdminGroup;
}>;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];
