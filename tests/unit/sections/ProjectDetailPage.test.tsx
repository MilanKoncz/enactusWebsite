import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ProjectDetailPage } from "@/components/sections/ProjectDetailPage";
import { projects } from "@/content/projects";

const smilegreen = projects.find((p) => p.slug === "smilegreen")!;
const resoap = projects.find((p) => p.slug === "resoap")!;
const mealyo = projects.find((p) => p.slug === "mealyo")!;
const differgy = projects.find((p) => p.slug === "differgy")!;

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
        "Wir entwickeln eine kompromisslos nachhaltige Zahnbürste, die gleichzeitig zu 100 % hygienisch ist. Durch unsere Materialkomposition aus einem zu einem Hochleistungselastomer transformierten Naturkautschuk, PHA und Bio-PE bieten wir die Lösung, die nachhaltiges Zähneputzen hygienisch macht.",
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

  it("names both project leads", () => {
    renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(screen.getAllByText("Tim Köster").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Franka Zanolli").length).toBeGreaterThan(0);
  });

  it("shows the process stage and the SDG focus", () => {
    renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(screen.getByText("Prozessstufe")).toBeInTheDocument();
    expect(screen.getByText("MVP-Phase")).toBeInTheDocument();
    expect(screen.getByText("SDG-Fokus")).toBeInTheDocument();
    for (const goal of [3, 12, 13]) {
      expect(screen.getByTitle(`UN-Nachhaltigkeitsziel ${goal}`)).toBeInTheDocument();
    }
  });

  it("omits the stage and SDG block for a project with neither", () => {
    renderWithIntl(<ProjectDetailPage project={differgy} />);
    expect(screen.queryByText("Prozessstufe")).not.toBeInTheDocument();
    expect(screen.queryByText("SDG-Fokus")).not.toBeInTheDocument();
  });

  it("links the project's LinkedIn page alongside the website placeholder", () => {
    renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(screen.getByRole("link", { name: "Projekt auf LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/company/smilegreen-oral-care/",
    );
  });

  it("links a project's own website when there is one", () => {
    renderWithIntl(<ProjectDetailPage project={mealyo} />);
    expect(screen.getByRole("link", { name: "Projektwebsite besuchen" })).toHaveAttribute(
      "href",
      "https://mealyo.de",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ProjectDetailPage project={smilegreen} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
