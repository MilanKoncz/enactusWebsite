import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabBoundary } from "@/components/sections/InnoLabBoundary";

// The section this whole task exists for: the split must be unambiguous
// (separate sign-ups, InnoLab means weekly sessions plus membership, the
// Ideathon needs no membership) while still reading as a warm invitation to
// both — see InnoLabBoundary.tsx's own comment.
describe("InnoLabBoundary", () => {
  it("names both sign-ups by their own heading", () => {
    renderWithIntl(<InnoLabBoundary />);
    expect(screen.getByRole("heading", { level: 3, name: "Fürs InnoLab" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Für den Ideathon" })).toBeInTheDocument();
  });

  it("states InnoLab means weekly sessions and membership", () => {
    renderWithIntl(<InnoLabBoundary />);
    expect(
      screen.getByText(/kommst zu den wöchentlichen Sessions und wirst Mitglied/),
    ).toBeInTheDocument();
  });

  it("states the Ideathon needs no membership", () => {
    renderWithIntl(<InnoLabBoundary />);
    expect(screen.getByText(/In den Verein eintreten musst du dafür nicht/)).toBeInTheDocument();
  });

  it("links each block to its real sign-up route", () => {
    renderWithIntl(<InnoLabBoundary />);
    expect(screen.getByRole("link", { name: "Zur Bewerbung" })).toHaveAttribute("href", "/mitmachen");
    expect(screen.getByRole("link", { name: "Zum Ideathon" })).toHaveAttribute("href", "/ideathon");
  });

  it("closes with a warm invitation to both, not just the split", () => {
    renderWithIntl(<InnoLabBoundary />);
    expect(screen.getByText(/Wir sehen dich also gern bei beidem/)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabBoundary />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
