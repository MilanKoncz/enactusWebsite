import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { EventFormats } from "@/components/sections/EventFormats";

// Both the desktop tablist (role="tab") and the mobile accordion (plain
// buttons) render in jsdom at once — there's no real viewport to make the
// `hidden md:flex` / `md:hidden` utility classes take effect, same reasoning
// tests/e2e/prozess.spec.ts documents for ThreadSegment's two paths. Role
// tells the two apart: Radix Tabs.Trigger is role="tab", Accordion.Trigger
// is a plain button.
describe("EventFormats", () => {
  it("renders all four formats as both a tablist and an accordion", () => {
    renderWithIntl(<EventFormats />);
    for (const title of ["Socials", "Workshops", "Teamwochenende", "Journeys"]) {
      expect(screen.getByRole("tab", { name: title })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
  });

  it("selects the first format by default and shows its detail in the desktop panel", () => {
    renderWithIntl(<EventFormats />);
    expect(screen.getByRole("tab", { name: "Socials" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Workshops" })).toHaveAttribute("aria-selected", "false");
    // Present in both the desktop panel and the (also-rendered-in-jsdom)
    // accordion, which starts on the same default selection.
    expect(screen.getAllByText("BESCHREIBUNG_FEHLT").length).toBeGreaterThan(0);
  });

  it("switches the shared panel when a different tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<EventFormats />);

    await user.click(screen.getByRole("tab", { name: "Workshops" }));
    expect(screen.getByRole("tab", { name: "Workshops" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Socials" })).toHaveAttribute("aria-selected", "false");
  });

  it("keeps the tablist and the accordion in sync, since both read the same selection", async () => {
    const user = userEvent.setup();
    renderWithIntl(<EventFormats />);

    await user.click(screen.getByRole("button", { name: "Teamwochenende" }));
    expect(screen.getByRole("tab", { name: "Teamwochenende" })).toHaveAttribute("aria-selected", "true");
  });

  it("expands only the clicked accordion item, closing the previous one", async () => {
    const user = userEvent.setup();
    renderWithIntl(<EventFormats />);

    const socials = screen.getByRole("button", { name: "Socials" });
    const workshops = screen.getByRole("button", { name: "Workshops" });
    expect(socials).toHaveAttribute("aria-expanded", "true");

    await user.click(workshops);
    expect(workshops).toHaveAttribute("aria-expanded", "true");
    expect(socials).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<EventFormats />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
