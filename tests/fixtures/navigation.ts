import { vi } from "vitest";

/**
 * Mocks next/navigation's usePathname/useRouter — next-intl's own navigation
 * hooks are thin wrappers over these (verified in next-intl's
 * useBasePathname.js), so mocking here keeps next-intl's real prefix-stripping
 * and prefixing logic under test instead of replacing it.
 *
 * mockPathname must return the raw, still-locale-prefixed pathname (e.g.
 * "/en/projekte" for the EN case) — next-intl's usePathname() strips the
 * prefix itself using the locale from NextIntlClientProvider, and that
 * stripping is exactly the behavior worth exercising.
 *
 * Usage, at the top of a test file (vi.mock is hoisted, so the factory must
 * import this lazily):
 *
 *   vi.mock("next/navigation", async () => (await import("../../fixtures/navigation")).nextNavigationMock);
 *
 * Then per test: mockPathname.mockReturnValue("/projekte");
 *
 * Deliberately not mocking next/link — it already renders a real <a> in
 * jsdom, so getByRole("link") assertions stay honest.
 */
export const mockPathname = vi.fn<() => string>(() => "/");

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

export const nextNavigationMock = {
  usePathname: () => mockPathname(),
  useRouter: () => mockRouter,
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  useServerInsertedHTML: () => {},
  notFound: vi.fn(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
};
