import de from "@/messages/de.json";
import en from "@/messages/en.json";

/**
 * `getTranslations` from `next-intl/server` picks its implementation via
 * the `react-server` export condition, which only Next's own bundler sets
 * — Vite/Vitest always resolves the client build instead, which throws by
 * design ("not supported in Client Components"). This isn't a bug in the
 * route handlers that call it; it only shows up under Vitest. Route
 * integration tests mock the module with this instead, reading the exact
 * same message catalogs `next-intl` would at runtime, so a test still
 * exercises the real mail copy rather than a stand-in string.
 */
const catalogs: Record<string, unknown> = { de, en };

function resolveNamespace(locale: string, namespace: string): Record<string, string> {
  const catalog = catalogs[locale] ?? catalogs.de;
  const node = namespace.split(".").reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], catalog);
  if (!node || typeof node !== "object") {
    throw new Error(`No messages found for namespace "${namespace}" in locale "${locale}"`);
  }
  return node as Record<string, string>;
}

export const nextIntlServerMock = {
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const messages = resolveNamespace(locale, namespace);
    const t = (key: string, params: Record<string, string> = {}) => {
      const template = messages[key];
      if (typeof template !== "string") throw new Error(`Missing message "${namespace}.${key}" for locale "${locale}"`);
      return template.replace(/\{(\w+)\}/g, (match, paramKey: string) => params[paramKey] ?? match);
    };
    return t;
  },
};
