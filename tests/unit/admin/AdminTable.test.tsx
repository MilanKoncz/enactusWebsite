import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { AdminTable } from "@/components/admin/AdminTable";

describe("AdminTable", () => {
  it("renders a real table with column headers scoped to their column", () => {
    render(
      <AdminTable
        columns={["Name", "E-Mail"]}
        rows={[{ key: "1", cells: ["Jäne Döe", "jane@example.com"] }]}
        empty="Nichts da."
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    const header = screen.getByRole("columnheader", { name: "Name" });
    expect(header).toHaveAttribute("scope", "col");
    expect(screen.getByRole("cell", { name: "jane@example.com" })).toBeInTheDocument();
  });

  it("shows the empty message instead of an empty table when there are no rows", () => {
    render(<AdminTable columns={["Name"]} rows={[]} empty="Noch keine Einträge." />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Noch keine Einträge.")).toBeInTheDocument();
  });

  it("renders interactive cell content, not just strings", () => {
    render(
      <AdminTable
        columns={["Aktion"]}
        rows={[{ key: "1", cells: [<button key="b">Erneut senden</button>] }]}
        empty="Nichts da."
      />,
    );

    expect(screen.getByRole("button", { name: "Erneut senden" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AdminTable
        columns={["Name", "E-Mail"]}
        rows={[
          { key: "1", cells: ["Jäne Döe", "jane@example.com"] },
          { key: "2", cells: ["Max Muster", "max@example.com"] },
        ]}
        empty="Nichts da."
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
