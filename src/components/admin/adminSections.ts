import {
  Activity,
  BellRing,
  CalendarDays,
  CalendarRange,
  FileText,
  MailWarning,
  MessageSquare,
  Trash2,
} from "lucide-react";

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
  { href: "/admin/bewerbungen", messageKey: "applications", icon: FileText },
  { href: "/admin/mails", messageKey: "failedMails", icon: MailWarning },
  { href: "/admin/bewerbungsfenster", messageKey: "recruitingWindows", icon: CalendarRange },
  { href: "/admin/termine", messageKey: "calendarEvents", icon: CalendarDays },
  { href: "/admin/erinnerungen", messageKey: "reminders", icon: BellRing },
  { href: "/admin/kontakt", messageKey: "contactMessages", icon: MessageSquare },
  { href: "/admin/loeschanfragen", messageKey: "deletionRequests", icon: Trash2 },
  { href: "/admin/system", messageKey: "system", icon: Activity },
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];
