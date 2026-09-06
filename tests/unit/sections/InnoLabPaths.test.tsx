import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabPaths } from "@/components/sections/InnoLabPaths";

describe("InnoLabPaths", () => {
  it("renders both entry paths with their own heading", () => {
    renderWithIntl(<InnoLabPaths />);
    expect(screen.getByRole("heading", { level: 3, name: "Über den Ideathon" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Mit deiner eigenen Idee" })).toBeInTheDocument();
  });

  it("links the Ideathon path to /ideathon", () => {
    renderWithIntl(<InnoLabPaths />);
    expect(screen.getByRole("link", { name: "Mehr zum Ideathon" })).toHaveAttribute("href", "/ideathon");
  });

  it("scrolls the own-idea path to the steps section, not a route", () => {
    renderWithIntl(<InnoLabPaths />);
    expect(screen.getByRole("link", { name: "Zu den Schritten" })).toHaveAttribute("href", "#schritte");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabPaths />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
