import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { AdminRowActions, AdminToggleButton, ReservedLabel } from "@/components/admin/AdminRowActions";

describe("ReservedLabel", () => {
  it("renders the current label visibly and every other label as invisible, aria-hidden filler", () => {
    render(<ReservedLabel current="Aktivieren" others={["Aktivieren", "Deaktivieren"]} />);

    const current = screen.getByText("Aktivieren");
    expect(current).not.toHaveAttribute("aria-hidden");
    expect(current).not.toHaveClass("invisible");

    // jsdom applies no real CSS, so a visibility assertion here would only
    // check jest-dom's own default (always "visible") — the actual
    // reservation is exercised by the "no layout shift" browser measurement
    // this fix was built against (see AdminRowActions.tsx's own comment for
    // the numbers). What's checked here is the DOM contract: the class that
    // makes it invisible, and the aria-hidden that removes it from the
    // accessible name.
    const reserved = screen.getByText("Deaktivieren", { selector: "[aria-hidden]" });
    expect(reserved).toHaveClass("invisible");
    expect(reserved).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the accessible name limited to the current label, not every reserved alternative", () => {
    render(
      <button>
        <ReservedLabel current="Aktivieren" others={["Aktivieren", "Deaktivieren"]} />
      </button>,
    );

    expect(screen.getByRole("button", { name: "Aktivieren" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deaktivieren" })).not.toBeInTheDocument();
  });

  it("does not duplicate the current label as its own hidden alternative", () => {
    const { container } = render(<ReservedLabel current="Aktivieren" others={["Aktivieren", "Deaktivieren"]} />);
    expect(container.querySelectorAll("span[aria-hidden]")).toHaveLength(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ReservedLabel current="Aktivieren" others={["Aktivieren", "Deaktivieren"]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("AdminToggleButton", () => {
  it("renders a real button whose accessible name is only the current label", () => {
    const onClick = vi.fn();
    render(
      <AdminToggleButton current="Deaktivieren" labels={["Aktivieren", "Deaktivieren"]} onClick={onClick} />,
    );

    const button = screen.getByRole("button", { name: "Deaktivieren" });
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("respects disabled", () => {
    render(
      <AdminToggleButton
        current="Aktivieren"
        labels={["Aktivieren", "Deaktivieren"]}
        onClick={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByRole("button", { name: "Aktivieren" })).toBeDisabled();
  });
});

describe("AdminRowActions", () => {
  it("wraps its children in the one shared action-cell layout", () => {
    const { container } = render(
      <AdminRowActions>
        <button>Bearbeiten</button>
        <button>Löschen</button>
      </AdminRowActions>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("flex", "flex-wrap", "items-center", "gap-2");
    expect(screen.getByRole("button", { name: "Bearbeiten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Löschen" })).toBeInTheDocument();
  });
});
