import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ProjectsStars } from "@/components/sections/ProjectsStars";
import { stars } from "@/content/stars";

describe("ProjectsStars", () => {
  it("renders all eight stars by name", () => {
    renderWithIntl(<ProjectsStars />);
    // Each name appears twice: once as the logo placeholder's label, once
    // as the name caption below it — same pattern as BoardGrid's portraits.
    for (const star of stars) {
      expect(screen.getAllByText(star.name).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("renders a play button only for the two stars with a confirmed YouTube pitch", () => {
    renderWithIntl(<ProjectsStars />);
    expect(screen.getByRole("button", { name: "Pitch von Moufense ansehen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pitch von Flat Mates ansehen" })).toBeInTheDocument();
    expect(screen.getAllByText("Kein Video verfügbar.")).toHaveLength(stars.length - 2);
  });

  it("loads the youtube-nocookie.com embed only after the play button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectsStars />);

    const button = screen.getByRole("button", { name: "Pitch von Moufense ansehen" });
    await user.click(button);

    const iframe = screen.getByTitle("Moufense");
    expect(iframe).toHaveAttribute("src", expect.stringContaining("youtube-nocookie.com/embed/9Ord09u363s"));
  });

  it("links to the project archive", () => {
    renderWithIntl(<ProjectsStars />);
    expect(
      screen.getByRole("link", { name: "Alle bisherigen Projekte im Archiv ansehen" }),
    ).toHaveAttribute("href", "/projekte/archiv");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ProjectsStars />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
