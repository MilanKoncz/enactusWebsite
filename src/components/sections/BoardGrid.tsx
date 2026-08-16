import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProximityGroup } from "@/components/motion/ProximityGroup";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { board } from "@/content/board";
import Image from "next/image";
// No LinkedIn brand icon: neither @icons-pack/react-simple-icons (dropped
// after a takedown, see Footer.tsx) nor lucide-react ship one, so this uses
// the same text-only fallback Footer already established. Same
// hover-or-focus reveal mechanic as Pillars/Benefits (desktop-hover, tabIndex
// on the group so it's keyboard-reachable), applied to a badge instead of a
// paragraph — on touch and small screens it's simply always visible.
//
// The pointer-proximity lift/saturation (ProximityGroup, `proximity-item` +
// `data-portrait` below) is a separate, purely decorative layer on top: it's
// disabled outright on touch and under reduced motion (ProximityGroup never
// attaches a listener there), and the LinkedIn link, name, and role stay
// reachable and legible exactly as before regardless of pointer state — the
// effect is never the only way to reach any of that.
const LINKEDIN_MARK_CLASSES =
  "absolute left-2 top-2 rounded-sm bg-paper/90 px-2 py-0.5 text-mono-xs font-mono uppercase text-ink transition-opacity duration-[var(--duration-fast)] ease-signature desktop-hover:opacity-0 desktop-hover:group-hover:opacity-100 desktop-hover:group-focus-within:opacity-100";

// Zoom lands on the crop itself (this Placeholder/photo), never on
// data-portrait or the card around it — docs/design-system.md's Interaction
// section: "no layout shift". data-portrait's own overflow-hidden (above) is
// what turns the scale into a crop instead of the image spilling over its
// neighbors. Exported for the same reason NAV_BUTTON_CLASSES is: the
// styleguide demos the real class string.
export const PORTRAIT_ZOOM_CLASSES =
  "transition-transform duration-[var(--duration-calm)] ease-signature desktop-hover:group-hover:scale-[1.06] desktop-hover:group-focus-within:scale-[1.06]";

// member.slug is a validated string (content/board.ts), not a literal union,
// so next-intl's typed message keys can't statically confirm it names a real
// "Board.<slug>" entry — cast, the same way Footer.tsx casts `item.key` to
// `RouteKey` for the same reason.
type BoardBioKey = Parameters<ReturnType<typeof useTranslations<"Board">>>[0];

export function BoardGrid() {
  const t = useTranslations("BoardGrid");
  const tBoard = useTranslations("Board");
  const tPlaceholder = useTranslations("Placeholder");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="board" />
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ProximityGroup className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {board.map((member) => (
            <div
              key={member.slug}
              tabIndex={0}
              className="group proximity-item flex flex-col gap-3">
              <div data-portrait className="relative overflow-hidden rounded-md aspect-3/4 w-full">
                {member.photo ? (
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className={PORTRAIT_ZOOM_CLASSES}
                  />
                ) : (
                  <Placeholder
                    kind="Foto"
                    label={member.name}
                    ratio="3 / 4"
                    className={PORTRAIT_ZOOM_CLASSES}
                  />
                )}

                {member.linkedinUrl ? (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("linkedinLabel", { name: member.name })}
                    className={LINKEDIN_MARK_CLASSES}>
                    {t("linkedin")}
                  </a>
                ) : (
                  <PlaceholderMark
                    hint={tPlaceholder("missingHint")}
                    className={LINKEDIN_MARK_CLASSES}>
                    {t("linkedin")}
                  </PlaceholderMark>
                )}
              </div>
              <p className="text-body-m font-medium">{member.name}</p>
              <p className="text-body-s opacity-60">{member.role}</p>
              <p className="text-body-s opacity-80">
                {tBoard(`${member.slug}.bio` as BoardBioKey)}
              </p>
            </div>
          ))}
        </ProximityGroup>
      </Container>
    </Section>
  );
}
