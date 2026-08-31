import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";

const OPTIONS = [
  { value: "team-lead", label: "Team-Lead" },
  { value: "finance-lead", label: "Finance-Lead" },
  { value: "operations-lead", label: "Operations-Lead" },
];

describe("CheckboxGroup", () => {
  it("renders a fieldset whose accessible name comes from the legend", () => {
    render(<CheckboxGroup legend="Ressorts" options={OPTIONS} value={[]} onChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Ressorts" })).toBeInTheDocument();
  });

  it("renders every option as its own checkbox, checked according to value", () => {
    render(
      <CheckboxGroup legend="Ressorts" options={OPTIONS} value={["finance-lead"]} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("checkbox", { name: "Team-Lead" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Finance-Lead" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Operations-Lead" })).not.toBeChecked();
  });

  it("calls onChange with the option added when an unchecked box is checked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CheckboxGroup legend="Ressorts" options={OPTIONS} value={["team-lead"]} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Finance-Lead" }));

    expect(onChange).toHaveBeenCalledWith(["team-lead", "finance-lead"]);
  });

  it("calls onChange with the option removed when a checked box is unchecked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CheckboxGroup
        legend="Ressorts"
        options={OPTIONS}
        value={["team-lead", "finance-lead"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Team-Lead" }));

    expect(onChange).toHaveBeenCalledWith(["finance-lead"]);
  });

  it("disables every unchecked box once max is reached, without disabling the checked ones", () => {
    render(
      <CheckboxGroup
        legend="Ressorts"
        options={OPTIONS}
        value={["team-lead", "finance-lead"]}
        onChange={vi.fn()}
        max={2}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Operations-Lead" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Team-Lead" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Finance-Lead" })).toBeEnabled();
  });

  it("never calls onChange for a disabled box a visitor tries to click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CheckboxGroup
        legend="Ressorts"
        options={OPTIONS}
        value={["team-lead", "finance-lead"]}
        onChange={onChange}
        max={2}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Operations-Lead" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("announces the live count via aria-live, distinct from the hint", () => {
    render(
      <CheckboxGroup
        legend="Ressorts"
        hint="Optional, bis zu 3 Ressorts."
        countLabel="2 von 3 ausgewählt"
        options={OPTIONS}
        value={["team-lead", "finance-lead"]}
        onChange={vi.fn()}
        max={3}
      />,
    );

    const count = screen.getByText("2 von 3 ausgewählt");
    expect(count).toHaveAttribute("aria-live", "polite");
  });

  it("shows the error message, with an icon, when given one", () => {
    render(
      <CheckboxGroup
        legend="Ressorts"
        error="Bitte wähle höchstens 3 Ressorts, jedes nur einmal."
        options={OPTIONS}
        value={[]}
        onChange={vi.fn()}
      />,
    );
    const error = screen.getByText("Bitte wähle höchstens 3 Ressorts, jedes nur einmal.");
    expect(error).toBeInTheDocument();
    expect(error.querySelector("svg")).toBeInTheDocument();
  });

  it("is fully operable by keyboard: tab to a box and toggle it with Space", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CheckboxGroup legend="Ressorts" options={OPTIONS} value={[]} onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Team-Lead" })).toHaveFocus();
    await user.keyboard(" ");

    expect(onChange).toHaveBeenCalledWith(["team-lead"]);
  });

  it("skips a disabled box when tabbing through the group", async () => {
    const user = userEvent.setup();
    render(
      <CheckboxGroup
        legend="Ressorts"
        options={OPTIONS}
        value={["team-lead", "finance-lead"]}
        onChange={vi.fn()}
        max={2}
      />,
    );

    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Team-Lead" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Finance-Lead" })).toHaveFocus();
    // Operations-Lead is disabled at the cap — tabbing skips it entirely,
    // browser-native behavior for a disabled form control.
    await user.tab();
    expect(within(document.body).queryByRole("checkbox", { name: "Operations-Lead" })).not.toHaveFocus();
  });

  it("has no accessibility violations, checked, unchecked, disabled, and with an error", async () => {
    const { container } = render(
      <CheckboxGroup
        legend="Ressorts"
        hint="Optional, bis zu 3 Ressorts."
        error="Bitte wähle höchstens 3 Ressorts, jedes nur einmal."
        options={OPTIONS}
        value={["team-lead", "finance-lead"]}
        onChange={vi.fn()}
        max={2}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
