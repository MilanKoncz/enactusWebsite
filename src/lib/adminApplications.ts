import type { ApplicationSummary } from "./db";

/**
 * Groups /admin/bewerbungen's flat application list by recruiting_semester,
 * newest first — both the groups themselves and each group's applications.
 * "Newest" for a group means the most recent application in it, since a
 * semester label ("HWS26") doesn't sort chronologically as a string.
 *
 * A pure function of the list `listApplications()` already returns, kept
 * separate from the page component so the grouping/ordering rule is
 * unit-testable without a database.
 */
export type ApplicationGroup = {
  semester: string;
  applications: ApplicationSummary[];
};

export function groupApplicationsBySemester(applications: ApplicationSummary[]): ApplicationGroup[] {
  const bySemester = new Map<string, ApplicationSummary[]>();
  for (const application of applications) {
    const existing = bySemester.get(application.recruitingSemester);
    if (existing) existing.push(application);
    else bySemester.set(application.recruitingSemester, [application]);
  }

  return Array.from(bySemester.entries())
    .map(([semester, group]) => ({
      semester,
      applications: [...group].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    }))
    .sort((a, b) => b.applications[0].createdAt.getTime() - a.applications[0].createdAt.getTime());
}
