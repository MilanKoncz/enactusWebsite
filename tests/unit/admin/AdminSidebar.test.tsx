import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockPathname, nextNavigationMock } from "../../fixtures/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

vi.mock("next/navigation", () => nextNavigationMock);

afterEach(() => {
  vi.resetAllMocks();
});

describe("AdminSidebar", () => {
  it("links the logo back to the public site even when there is no session", () => {
    renderWithIntl(<AdminSidebar authenticated={false} />);
    const homeLink = screen.getByRole("link", { name: "Zur Website" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders no nav or logout button without a session", () => {
    renderWithIntl(<AdminSidebar authenticated={false} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abmelden" })).not.toBeInTheDocument();
  });

  it("expands the nav panel via the mobile toggle when authenticated", async () => {
    mockPathname.mockReturnValue("/admin");
    const user = userEvent.setup();
    renderWithIntl(<AdminSidebar authenticated={true} />);

    const toggle = screen.getByRole("button", { name: /Adminbereiche/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Adminbereiche" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mockPathname.mockReturnValue("/admin");
    const { container } = renderWithIntl(<AdminSidebar authenticated={true} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
