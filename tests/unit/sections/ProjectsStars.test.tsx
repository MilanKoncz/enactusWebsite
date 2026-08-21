import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ProjectsStars } from "@/components/sections/ProjectsStars";
import { stars } from "@/content/stars";

describe("ProjectsStars", () => {
  it("renders all seven real stars by name", () => {
    renderWithIntl(<ProjectsStars />);
    // Without a real logo, the name appears twice: once as the logo
    // placeholder's label, once as the name caption below it — same pattern
    // as BoardGrid's portraits. Blauherz, Moufense, and Afya have a real
    // logo, rendered with an empty alt (the caption already names it), so
    // their name appears only once.
    for (const star of stars) {
      const expected = star.logo ? 1 : 2;
      expect(screen.getAllByText(star.name).length).toBeGreaterThanOrEqual(expected);
    }
  });

  it("renders a visible empty state for the unassigned 8th slot", () => {
    renderWithIntl(<ProjectsStars />);
    expect(screen.getByText("Noch offen")).toBeInTheDocument();
    expect(screen.getByText("Hier steht bald das nächste Star-Projekt.")).toBeInTheDocument();
  });

  it("renders a play button only for the one star with a confirmed YouTube pitch", () => {
    renderWithIntl(<ProjectsStars />);
    expect(screen.getByRole("button", { name: "Pitch von Moufense ansehen" })).toBeInTheDocument();
    expect(screen.getAllByText("Kein Video verfügbar.")).toHaveLength(stars.length - 1);
  });

  it("loads the youtube-nocookie.com embed only after the play button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectsStars />);

    const button = screen.getByRole("button", { name: "Pitch von Moufense ansehen" });
    await user.click(button);

    const iframe = screen.getByTitle("Moufense");
    expect(iframe).toHaveAttribute("src", expect.stringContaining("youtube-nocookie.com/embed/9Ord09u363s"));
  });

  it("marks Sunte's still-unconfirmed fact with the unverified hint, not as plain confirmed prose", () => {
    renderWithIntl(<ProjectsStars />);
    expect(
      screen.getByText(/Dieser Fakt ist noch nicht endgültig vom Vorstand bestätigt\./),
    ).toBeInTheDocument();
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
