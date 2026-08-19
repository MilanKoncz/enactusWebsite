import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { routes } from "@/content/navigation";
import { Link } from "@/lib/navigation";

// Next.js's not-found.tsx convention doesn't receive route params, so this
// relies on the request-scoped locale the [locale] layout already set via
// setRequestLocale rather than an explicit locale override.
//
// "404" is the motif, not a warning: large display font, the same
// register as a homepage headline, not an alarm color or a filled button
// telling the visitor what to do next. The heading itself stays the
// meaningful text (t("title")) for anyone using a screen reader; "404" is a
// decorative aria-hidden echo of it, not a replacement.
//
// Gold as a text color is only allowed on ink (docs/design-system.md — gold
// on paper measures 1.47:1). The page runs on an ink surface for that
// reason, not on paper with a gold override.
export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <Section surface="ink">
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <p aria-hidden="true" className="text-display-1 font-display leading-none text-gold">
          404
        </p>
        <h1 className="text-heading-2 font-sans">{t("title")}</h1>
        <p className="max-w-md text-body-l opacity-60">{t("note")}</p>
        <Link href={routes.home} className="link-underline text-body-m">
          {t("backHome")}
        </Link>
      </Container>
    </Section>
  );
}
