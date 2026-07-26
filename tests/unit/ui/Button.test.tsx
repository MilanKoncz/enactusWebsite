import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Button } from "@/components/ui/Button";
import { renderWithIntl } from "../../fixtures/intl";

describe("Button", () => {
  it("renders as a native button by default", () => {
    render(<Button>Bewerbung absenden</Button>);
    expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
  });

  it("renders as a real link when href is given, keeping link semantics", () => {
    // next-intl's Link (used for the enabled-link branch) reads locale from
    // context and throws without a provider — renderWithIntl supplies it.
    renderWithIntl(<Button href="/mitmachen">Jetzt bewerben</Button>);
    const link = screen.getByRole("link", { name: "Jetzt bewerben" });
    expect(link).toHaveAttribute("href", "/mitmachen");
  });

  it("activates on click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Absenden</Button>);
    await user.click(screen.getByRole("button", { name: "Absenden" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("activates when focused and pressing Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Absenden</Button>);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("activates when focused and pressing Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Absenden</Button>);
    await user.tab();
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and blocks activation when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Absenden
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Absenden" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("marks itself busy and blocks activation while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Absenden
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Absenden" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("marks a loading link as aria-disabled and blocks navigation on click", async () => {
    const onClick = vi.fn();
    render(
      <Button href="/mitmachen" loading onClick={onClick}>
        Jetzt bewerben
      </Button>,
    );
    const link = screen.getByText("Jetzt bewerben").closest("a");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabIndex", "-1");
    link?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no accessibility violations across variants and states", async () => {
    const { container } = renderWithIntl(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="glass">Glass</Button>
        <Button href="/mitmachen">Link</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
