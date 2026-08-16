import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ProjectsArchive } from "@/components/sections/ProjectsArchive";
import { projects } from "@/content/projects";

const archivedProjects = projects.filter((project) => project.status !== "active");

describe("ProjectsArchive", () => {
  it("renders every non-active project, linking to its own detail page", () => {
    renderWithIntl(<ProjectsArchive />);
    for (const project of archivedProjects) {
      const link = screen.getByRole("link", { name: new RegExp(project.name) });
      expect(link).toHaveAttribute("href", `/projekte/${project.slug}`);
    }
  });

  it("excludes the active projects — they already appear on /projekte", () => {
    renderWithIntl(<ProjectsArchive />);
    for (const project of projects.filter((p) => p.status === "active")) {
      expect(screen.queryByRole("link", { name: new RegExp(project.name) })).not.toBeInTheDocument();
    }
  });

  it("shows Differgy's spin-off badge as a success state, not the cancelled treatment", () => {
    renderWithIntl(<ProjectsArchive />);
    const differgyLink = screen.getByRole("link", { name: /Differgy/ });
    expect(differgyLink).toHaveTextContent("Ausgegründet");
    expect(differgyLink).not.toHaveTextContent("Eingestellt");
  });

  it("marks a project's missing year as a placeholder", () => {
    renderWithIntl(<ProjectsArchive />);
    expect(screen.getAllByText("Angabe fehlt").length).toBe(archivedProjects.length);
  });

  it("links back to the main projects page", () => {
    renderWithIntl(<ProjectsArchive />);
    expect(screen.getByRole("link", { name: "Zurück zu den aktuellen Projekten" })).toHaveAttribute(
      "href",
      "/projekte",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ProjectsArchive />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
