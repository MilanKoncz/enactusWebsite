import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The admin area's one table. Extracted from the hand-rolled markup that
 * /admin/bewerbungen carried when it was the only admin page — this is the
 * "shared primitive before the third copy" rule, applied at copy two,
 * since every new section here is a list of rows.
 *
 * There is deliberately no generic Table in components/ui/: nothing on the
 * public site renders tabular data (the Datenschutz page's two "tables"
 * are definition lists so they reflow at 360px), so a primitive there
 * would be built for exactly one consumer that lives somewhere else.
 *
 * Cells are ReactNode, not strings: several sections need a button or a
 * coloured status inside a cell, and a stringly-typed table would push
 * every one of those into a wrapper component instead.
 */
export type AdminTableRow = {
  key: string;
  cells: ReactNode[];
};

export function AdminTable({
  columns,
  rows,
  empty,
  minWidthClassName = "min-w-[640px]",
}: {
  columns: ReactNode[];
  rows: AdminTableRow[];
  empty: ReactNode;
  minWidthClassName?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-body-m opacity-60">{empty}</p>;
  }

  return (
    // The scroll container, not the page, is what scrolls sideways — the
    // quality floor in CLAUDE.md forbids a horizontally scrolling body, and
    // an admin table with six columns cannot fit 360px honestly.
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-body-s", minWidthClassName)}>
        <thead>
          <tr className="border-b border-ink/10 text-left">
            {columns.map((column, index) => (
              <th key={index} scope="col" className="py-2 pr-4 align-bottom font-medium last:pr-0">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-ink/5 align-top">
              {row.cells.map((cell, index) => (
                <td key={index} className="py-2 pr-4 last:pr-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
