import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InterviewAvailabilityMatrix as MatrixData } from "@/lib/interviewAvailabilityMatrix";

type InterviewAvailabilityMatrixProps = {
  matrix: MatrixData;
  captionLabel: string;
  applicantColumnLabel: string;
  totalColumnLabel: string;
  totalsRowLabel: string;
  noAnswerLabel: string;
  noneChosenLabel: string;
  notConfiguredLabel: string;
  availableLabel: string;
  notAvailableLabel: string;
  dayHeading: (day: string) => string;
};

// Relative to this semester's own busiest slot, not an absolute headcount
// the board never told this component — four static, Tailwind-scannable
// buckets so "where it's tight" is visible without reading every number in
// the totals row.
function scarcityClassName(count: number, max: number): string {
  if (max === 0) return "";
  const ratio = count / max;
  if (ratio <= 0.25) return "bg-oxblood/15";
  if (ratio <= 0.5) return "bg-amber/15";
  if (ratio <= 0.75) return "bg-amber/5";
  return "";
}

/**
 * The "wer kann wann" overview for up to ~100 applicants and ~18 slots
 * (board brief). Deliberately not AdminTable: a two-row day/time header, a
 * totals row pinned right under it, and a sticky name column don't fit that
 * component's flat columns/cells model, and this is the first matrix in the
 * project — not yet the third copy that would justify a shared primitive.
 * It keeps AdminTable's own idiom regardless: the *container*, not the
 * page, scrolls horizontally (CLAUDE.md's 360px floor), via
 * `overflow-x-auto` here too.
 *
 * `border-separate border-spacing-0`, not the collapsed border AdminTable
 * uses — `position: sticky` on a `<th>`/`<td>` does not work at all under
 * `border-collapse` in any browser, and both the header row and the name
 * column need to stick.
 */
export function InterviewAvailabilityMatrix({
  matrix,
  captionLabel,
  applicantColumnLabel,
  totalColumnLabel,
  totalsRowLabel,
  noAnswerLabel,
  noneChosenLabel,
  notConfiguredLabel,
  availableLabel,
  notAvailableLabel,
  dayHeading,
}: InterviewAvailabilityMatrixProps) {
  const { columns, rows, columnTotals } = matrix;
  const maxTotal = Math.max(0, ...columnTotals);

  const dayGroups: Array<{ day: string; count: number }> = [];
  for (const column of columns) {
    const last = dayGroups[dayGroups.length - 1];
    if (last && last.day === column.day) last.count += 1;
    else dayGroups.push({ day: column.day, count: 1 });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-body-s">
        <caption className="sr-only">{captionLabel}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              rowSpan={2}
              className="sticky left-0 top-0 z-20 border-b border-r border-ink/10 bg-paper py-2 pr-4 text-left align-bottom font-medium"
            >
              {applicantColumnLabel}
            </th>
            {dayGroups.map((group) => (
              <th
                key={group.day}
                scope="colgroup"
                colSpan={group.count}
                className="sticky top-0 z-10 border-b border-ink/10 bg-paper py-1 text-center font-medium"
              >
                {dayHeading(group.day)}
              </th>
            ))}
            <th
              scope="col"
              rowSpan={2}
              className="sticky right-0 top-0 z-20 border-b border-l border-ink/10 bg-paper py-2 pl-4 text-center align-bottom font-medium"
            >
              {totalColumnLabel}
            </th>
          </tr>
          <tr>
            {columns.map((column) => (
              <th
                key={column.value}
                scope="col"
                className={cn(
                  "sticky top-8 z-10 whitespace-nowrap border-b border-ink/10 bg-paper px-2 py-1 text-center font-normal tabular-nums",
                  !column.configured && "italic opacity-60",
                )}
              >
                {column.startTime}
                {!column.configured && <span className="sr-only"> ({notConfiguredLabel})</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-ink/5">
            <th scope="row" className="sticky left-0 z-10 border-b border-r border-ink/10 bg-ink/5 py-2 pr-4 text-left font-medium">
              {totalsRowLabel}
            </th>
            {columnTotals.map((total, index) => (
              <td
                key={columns[index].value}
                className={cn(
                  "border-b border-ink/10 px-2 py-2 text-center tabular-nums",
                  scarcityClassName(total, maxTotal),
                )}
              >
                {total}
              </td>
            ))}
            <td className="sticky right-0 z-10 border-b border-l border-ink/10 bg-ink/5 py-2 pl-4 text-center" />
          </tr>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-ink/5">
              <th scope="row" className="sticky left-0 z-10 border-r border-ink/10 bg-paper py-2 pr-4 text-left font-normal">
                {row.name}
              </th>
              {!row.hasAnswer ? (
                <td colSpan={columns.length} className="px-2 py-2 opacity-60 italic">
                  {noAnswerLabel}
                </td>
              ) : (
                columns.map((column) => {
                  const checked = row.selected.includes(column.value);
                  return (
                    <td key={column.value} className="border-l border-ink/5 px-2 py-2 text-center">
                      {checked ? (
                        <>
                          <Check aria-hidden="true" className="mx-auto size-4 text-moss" />
                          <span className="sr-only">{availableLabel}</span>
                        </>
                      ) : (
                        <span className="sr-only">{notAvailableLabel}</span>
                      )}
                    </td>
                  );
                })
              )}
              <td className="sticky right-0 z-10 border-l border-ink/10 bg-paper py-2 pl-4 text-center tabular-nums">
                {row.hasAnswer ? (
                  row.selected.length
                ) : (
                  <span aria-hidden="true">–</span>
                )}
                {row.hasAnswer && row.selected.length === 0 && (
                  <span className="sr-only"> ({noneChosenLabel})</span>
                )}
                {!row.hasAnswer && <span className="sr-only">{noAnswerLabel}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
