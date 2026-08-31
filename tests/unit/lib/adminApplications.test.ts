import { describe, expect, it } from "vitest";
import { groupApplicationsBySemester } from "@/lib/adminApplications";
import type { ApplicationSummary } from "@/lib/db";

function application(overrides: Partial<ApplicationSummary>): ApplicationSummary {
  return {
    id: "id",
    createdAt: new Date("2026-09-05T10:00:00Z"),
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    studyProgram: "BWL",
    semester: 3,
    availabilityHours: 10,
    desiredAreas: ["SmileGreen"],
    areaChoices: [],
    languagesSkills: null,
    cvPathname: null,
    mailStatus: "sent",
    recruitingSemester: "HWS26",
    ...overrides,
  };
}

describe("groupApplicationsBySemester", () => {
  it("groups applications by their recruiting semester", () => {
    const groups = groupApplicationsBySemester([
      application({ id: "1", recruitingSemester: "HWS26" }),
      application({ id: "2", recruitingSemester: "FSS27" }),
      application({ id: "3", recruitingSemester: "HWS26" }),
    ]);

    expect(groups.map((group) => group.semester).sort()).toEqual(["FSS27", "HWS26"]);
    const hws26 = groups.find((group) => group.semester === "HWS26");
    expect(hws26?.applications.map((application) => application.id).sort()).toEqual(["1", "3"]);
  });

  it("orders groups by their most recent application, newest first", () => {
    const groups = groupApplicationsBySemester([
      application({ id: "old", recruitingSemester: "HWS25", createdAt: new Date("2025-09-05T10:00:00Z") }),
      application({ id: "new", recruitingSemester: "FSS27", createdAt: new Date("2027-03-05T10:00:00Z") }),
    ]);

    expect(groups.map((group) => group.semester)).toEqual(["FSS27", "HWS25"]);
  });

  it("orders applications within a group newest first, regardless of input order", () => {
    const groups = groupApplicationsBySemester([
      application({ id: "earlier", createdAt: new Date("2026-09-01T10:00:00Z") }),
      application({ id: "later", createdAt: new Date("2026-09-10T10:00:00Z") }),
    ]);

    expect(groups[0].applications.map((application) => application.id)).toEqual(["later", "earlier"]);
  });

  it("returns an empty list for no applications", () => {
    expect(groupApplicationsBySemester([])).toEqual([]);
  });
});
