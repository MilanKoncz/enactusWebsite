import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Impressum } from "@/components/sections/Impressum";
import { org } from "@/content/org";

describe("Impressum", () => {
  it("renders exactly one h1 titled Impressum", () => {
    renderWithIntl(<Impressum />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Impressum");
  });

  it("renders the operator's legal name and registered office", () => {
    renderWithIntl(<Impressum />);
    expect(screen.getByText(org.legalName)).toBeInTheDocument();
    expect(screen.getByText(org.registeredOffice!)).toBeInTheDocument();
  });

  it("renders the register entry", () => {
    renderWithIntl(<Impressum />);
    expect(screen.getByText(org.registerEntry!)).toBeInTheDocument();
  });

  it("renders every legal representative's name as a confirmed fact, not a placeholder", () => {
    renderWithIntl(<Impressum />);
    for (const name of org.legalRepresentatives.names) {
      // A RegExp rather than an exact string: non-last names share a text
      // node with the trailing ", " separator, so their node's normalized
      // text is "Name, " rather than "Name" alone.
      expect(screen.getByText(new RegExp(name))).toBeInTheDocument();
    }
    expect(org.legalRepresentatives.verified).toBe(true);
    expect(
      screen.queryByText(/Diese Namen sind noch nicht vom Vorstand bestätigt/),
    ).not.toBeInTheDocument();
  });

  it("renders the contact email as a real mailto link", () => {
    renderWithIntl(<Impressum />);
    const link = screen.getByRole("link", { name: org.contactEmails.board! });
    expect(link).toHaveAttribute("href", `mailto:${org.contactEmails.board}`);
  });

  it("states the content-responsible people are the same as the legal representatives", () => {
    renderWithIntl(<Impressum />);
    expect(screen.getByText("Dieselben Personen wie unter „Vertreten durch“.")).toBeInTheDocument();
  });

  it("renders a copyright line for the current year", () => {
    renderWithIntl(<Impressum />);
    expect(
      screen.getByText(new RegExp(`©\\s*${new Date().getFullYear()}\\s*Enactus Mannheim`)),
    ).toBeInTheDocument();
  });

  it("credits design and development as its own labeled block, not part of the responsible-persons list", () => {
    renderWithIntl(<Impressum />);
    expect(screen.getByRole("heading", { level: 2, name: "Gestaltung und Entwicklung" })).toBeInTheDocument();
    expect(screen.getByText("Milan Koncz")).toBeInTheDocument();
  });

  it("translates the design credit on the English route, unlike the legal labels above it", () => {
    renderWithIntl(<Impressum />, { locale: "en" });
    expect(screen.getByRole("heading", { level: 2, name: "Design and development" })).toBeInTheDocument();
    expect(screen.getByText("Milan Koncz")).toBeInTheDocument();
  });

  it("shows the English notice only on the English route", () => {
    renderWithIntl(<Impressum />, { locale: "en" });
    expect(
      screen.getByText(/This legal notice \(Impressum\) is required under German law/),
    ).toBeInTheDocument();
  });

  it("keeps the legal labels themselves in German even on the English route", () => {
    renderWithIntl(<Impressum />, { locale: "en" });
    expect(screen.queryByText(/This legal notice/)).toBeInTheDocument();
    expect(screen.getByText("Vertreten durch")).toBeInTheDocument();
    expect(screen.getByText("Diensteanbieter")).toBeInTheDocument();
    expect(screen.getByText(org.registerEntry!)).toBeInTheDocument();
  });

  it("does not show the English notice on the German route", () => {
    renderWithIntl(<Impressum />, { locale: "de" });
    expect(screen.queryByText(/This legal notice/)).not.toBeInTheDocument();
  });

  it("has no accessibility violations in German", async () => {
    const { container } = renderWithIntl(<Impressum />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations in English", async () => {
    const { container } = renderWithIntl(<Impressum />, { locale: "en" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
