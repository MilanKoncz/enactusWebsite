import type { routing } from "./routing";
import type de from "../messages/de.json";

// Makes every useTranslations()/t() call typo-checked at npm run typecheck —
// the same guarantee the Zod content schemas give the data layer.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof de;
  }
}
