import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ProjectDetailPage } from "@/components/sections/ProjectDetailPage";
import { projects } from "@/content/projects";

const smilegreen = projects.find((p) => p.slug === "smilegreen")!;
const resoap = projects.find((p) => p.slug === "resoap")!;

describe("ProjectDetailPage", () => {
  it("renders the project's name as the page heading and its status badge", () => {
    renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(screen.getByRole("heading", { level: 1, name: "SmileGreen" })).toBeInTheDocument();
    expect(screen.getByText("Aktiv")).toBeInTheDocument();
  });

  it("renders the full description, not just the one-liner", () => {
    renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(
      screen.getByText(
        "SmileGreen entwickelt eine Wechselkopfzahnbürste aus Naturkautschuk mit Borsten aus PHA-Biokunststoff. Sie ist innerhalb von vier Monaten zu 100 % kompostierbar und bietet über ein hygienisches Wechselkopfsystem eine nachhaltige Alternative zur Wegwerfzahnbürste.",
      ),
    ).toBeInTheDocument();
  });

  it("links back to the projects overview", () => {
    renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(screen.getByRole("link", { name: "Zurück zu den Projekten" })).toHaveAttribute(
      "href",
      "/projekte",
    );
  });

  it("marks a project without a confirmed lead as a placeholder, not blank fields", () => {
    renderWithIntl(<ProjectDetailPage project={resoap} />);
    expect(screen.getAllByText("Angabe fehlt").length).toBeGreaterThan(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
