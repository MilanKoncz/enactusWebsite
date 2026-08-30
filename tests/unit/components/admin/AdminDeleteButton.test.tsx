import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../fixtures/intl";
import { mockRouter, nextNavigationMock } from "../../../fixtures/navigation";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";

vi.mock("next/navigation", () => nextNavigationMock);

const ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

/**
 * The reusable delete action shared by /admin/bewerbungen,
 * /admin/erinnerungen, and /admin/ideathon-anmeldungen — see the
 * component's own comment on why it exists as its own primitive rather
 * than a fourth copy of the confirm()+fetch()+router.refresh() pattern
 * every *Manager.tsx component already has.
 */
describe("AdminDeleteButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockRouter.refresh.mockClear();
  });

  it("does nothing when the confirmation dialog is dismissed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup();

    renderWithIntl(
      <AdminDeleteButton endpoint="/api/admin/bewerbungen" id={ID} confirmLabel="Wirklich löschen?" />,
    );
    await user.click(screen.getByRole("button", { name: "Löschen" }));

    expect(window.confirm).toHaveBeenCalledWith("Wirklich löschen?");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it("calls the given endpoint with the row's id and refreshes the page on success", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const user = userEvent.setup();

    renderWithIntl(
      <AdminDeleteButton endpoint="/api/admin/bewerbungen" id={ID} confirmLabel="Wirklich löschen?" />,
    );
    await user.click(screen.getByRole("button", { name: "Löschen" }));

    expect(fetch).toHaveBeenCalledWith(`/api/admin/bewerbungen/${ID}`, { method: "DELETE" });
    // Revalidated via the server query, not assumed locally — the row
    // leaves the list because the database says it's gone.
    await vi.waitFor(() => expect(mockRouter.refresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a visible error and does not refresh when the request fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    const user = userEvent.setup();

    renderWithIntl(
      <AdminDeleteButton endpoint="/api/admin/bewerbungen" id={ID} confirmLabel="Wirklich löschen?" />,
    );
    await user.click(screen.getByRole("button", { name: "Löschen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Löschen ist fehlgeschlagen");
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it("shows a visible error, not a thrown exception, on a network failure", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const user = userEvent.setup();

    renderWithIntl(
      <AdminDeleteButton endpoint="/api/admin/erinnerungen" id={ID} confirmLabel="Wirklich löschen?" />,
    );
    await user.click(screen.getByRole("button", { name: "Löschen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Löschen ist fehlgeschlagen");
  });
});
