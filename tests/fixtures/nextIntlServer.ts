import de from "@/messages/de.json";
import en from "@/messages/en.json";

/**
 * `getTranslations` from `next-intl/server` picks its implementation via
 * the `react-server` export condition, which only Next's own bundler sets
 * — Vite/Vitest always resolves the client build instead, which throws by
 * design ("not supported in Client Components"). This isn't a bug in the
 * route handlers that call it; it only shows up under Vitest. Route and
 * page integration tests mock the module with this instead, reading the
 * exact same message catalogs `next-intl` would at runtime, so a test still
 * exercises the real copy rather than a stand-in string.
 *
 * Supports both call shapes next-intl offers, because both are used:
 * `getTranslations({ locale, namespace })` in `generateMetadata` (where
 * there's no request locale yet) and `getTranslations("Namespace")` inside
 * a page body. Keys may be dotted (`t("applications.columns.name")`) —
 * next-intl resolves those against the namespace, so this has to too, or a
 * page test would fail on the mock rather than on the page.
 */
const catalogs: Record<string, unknown> = { de, en };

function resolvePath(root: unknown, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], root);
}

function resolveNamespace(locale: string, namespace: string): Record<string, unknown> {
  const catalog = catalogs[locale] ?? catalogs.de;
  const node = resolvePath(catalog, namespace);
  if (!node || typeof node !== "object") {
    throw new Error(`No messages found for namespace "${namespace}" in locale "${locale}"`);
  }
  return node as Record<string, unknown>;
}

type TranslatorOptions = { locale?: string; namespace: string };

function createTranslator({ locale = "de", namespace }: TranslatorOptions) {
  const messages = resolveNamespace(locale, namespace);
  return (key: string, params: Record<string, string> = {}) => {
    const template = resolvePath(messages, key);
    if (typeof template !== "string") {
      throw new Error(`Missing message "${namespace}.${key}" for locale "${locale}"`);
    }
    return template.replace(/\{(\w+)\}/g, (match, paramKey: string) => params[paramKey] ?? match);
  };
}

export const nextIntlServerMock = {
  getTranslations: async (options: TranslatorOptions | string) =>
    createTranslator(typeof options === "string" ? { namespace: options } : options),
};
