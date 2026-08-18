import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { nextNavigationMock } from "../../fixtures/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

vi.mock("next/navigation", () => nextNavigationMock);

describe("AdminLoginForm", () => {
  it("hides the password by default", () => {
    renderWithIntl(<AdminLoginForm />);
    expect(screen.getByLabelText("Passwort")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Passwort anzeigen" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reveals the password on toggle and reports state via aria-pressed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AdminLoginForm />);

    await user.click(screen.getByRole("button", { name: "Passwort anzeigen" }));

    expect(screen.getByLabelText("Passwort")).toHaveAttribute("type", "text");
    const toggle = screen.getByRole("button", { name: "Passwort verbergen" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(screen.getByLabelText("Passwort")).toHaveAttribute("type", "password");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<AdminLoginForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
