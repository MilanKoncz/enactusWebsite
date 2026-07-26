import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockPathname } from "../../fixtures/navigation";
import { MobileMenu } from "@/components/layout/MobileMenu";

vi.mock("next/navigation", async () => (await import("../../fixtures/navigation")).nextNavigationMock);

function getFocusables(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button"));
}

describe("MobileMenu", () => {
  it("opens when the trigger is activated with Enter", async () => {
    mockPathname.mockReturnValue("/");
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("moves focus into the dialog on open", async () => {
    mockPathname.mockReturnValue("/");
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("traps Tab so it wraps from the last focusable element to the first", async () => {
    mockPathname.mockReturnValue("/");
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog");
    const focusables = getFocusables(dialog);
    focusables[focusables.length - 1].focus();
    await user.tab();
    expect(focusables[0]).toHaveFocus();
  });

  it("traps Shift+Tab so it wraps from the first focusable element to the last", async () => {
    mockPathname.mockReturnValue("/");
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog");
    const focusables = getFocusables(dialog);
    focusables[0].focus();
    await user.tab({ shift: true });
    expect(focusables[focusables.length - 1]).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    mockPathname.mockReturnValue("/");
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    const trigger = screen.getByRole("button", { name: "Menü öffnen" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when a nav link is activated", async () => {
    mockPathname.mockReturnValue("/");
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    await user.click(screen.getByRole("link", { name: "Prozess" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations while open", async () => {
    mockPathname.mockReturnValue("/");
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
  });
});
