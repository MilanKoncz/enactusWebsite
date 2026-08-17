import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CALENDAR_CATEGORIES } from "@/content/calendar";
import de from "@/messages/de.json";

describe("CategoryBadge", () => {
  it("renders every category with its translated name and an icon", () => {
    for (const category of CALENDAR_CATEGORIES) {
      const { unmount } = renderWithIntl(<CategoryBadge category={category} />);
      const label = de.CalendarCategories[category];
      const badge = screen.getByText(label).closest("span")!;
      expect(badge.querySelector("svg")).toBeInTheDocument();
      unmount();
    }
  });

  it("fills wettkaempfe with gold and ink text — the one filled category", () => {
    renderWithIntl(<CategoryBadge category="wettkaempfe" />);
    const badge = screen.getByText("Wettkämpfe").closest("span")!;
    expect(badge).toHaveClass("bg-cal-wettkaempfe");
    expect(badge).toHaveClass("text-ink");
  });

  it("renders the six other categories as an outline in their own color, never filled", () => {
    const outlineCategories = CALENDAR_CATEGORIES.filter((category) => category !== "wettkaempfe");
    for (const category of outlineCategories) {
      const { unmount } = renderWithIntl(<CategoryBadge category={category} />);
      const badge = document.querySelector(`.text-cal-${category}`);
      expect(badge).not.toBeNull();
      expect(badge).not.toHaveClass(`bg-cal-${category}`);
      unmount();
    }
  });

  it("mutes a past wettkaempfe row's text without dropping its gold fill", () => {
    renderWithIntl(<CategoryBadge category="wettkaempfe" past />);
    const badge = screen.getByText("Wettkämpfe").closest("span")!;
    expect(badge).toHaveClass("bg-cal-wettkaempfe");
    expect(badge).toHaveClass("text-ink/70");
  });

  it("has no accessibility violations in the filled or outline state", async () => {
    const { container } = renderWithIntl(
      <>
        <CategoryBadge category="wettkaempfe" />
        <CategoryBadge category="socials" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
