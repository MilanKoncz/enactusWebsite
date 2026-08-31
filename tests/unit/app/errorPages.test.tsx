import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../fixtures/intl";
import ErrorPage from "@/app/[locale]/error";
import AdminErrorPage from "@/app/[locale]/admin/error";
import AdminNotFound from "@/app/[locale]/admin/not-found";

// admin/not-found.tsx is a server component and calls getTranslations from
// next-intl/server, which throws under Vitest outside Next's own bundler
// (see fixtures/nextIntlServer.ts) — mocked the same way every other admin
// page test mocks it.
vi.mock("next-intl/server", async () => (await import("../../fixtures/nextIntlServer")).nextIntlServerMock);

const ERROR = Object.assign(new Error("boom"), { digest: "abc123" });

describe("[locale]/error.tsx", () => {
  it("shows the site's error copy and calls reset() from the retry button", async () => {
    const reset = vi.fn();
    renderWithIntl(<ErrorPage error={ERROR} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Da ist etwas schiefgelaufen." })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("links back to the homepage", () => {
    renderWithIntl(<ErrorPage error={ERROR} reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute("href", "/");
  });

  it("renders a real English translation", () => {
    renderWithIntl(<ErrorPage error={ERROR} reset={vi.fn()} />, { locale: "en" });
    expect(screen.getByRole("heading", { name: "Something went wrong." })).toBeVisible();
  });
});

describe("[locale]/admin/error.tsx", () => {
  it("names the database as the likely cause and calls reset() from the retry button", async () => {
    const reset = vi.fn();
    renderWithIntl(<AdminErrorPage error={ERROR} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Diese Ansicht konnte nicht geladen werden." })).toBeVisible();
    expect(screen.getByText(/Datenbankverbindung/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("links back to the admin overview", () => {
    renderWithIntl(<AdminErrorPage error={ERROR} reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Zur Übersicht" })).toHaveAttribute("href", "/admin");
  });
});

describe("[locale]/admin/not-found.tsx", () => {
  it("shows the admin 404 copy and a way back to the overview", async () => {
    renderWithIntl(await AdminNotFound());
    expect(screen.getByRole("heading", { name: "Diese Adminseite gibt es nicht." })).toBeVisible();
    expect(screen.getByRole("link", { name: "Zur Übersicht" })).toHaveAttribute("href", "/admin");
  });
});
