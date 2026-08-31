import { FaLinkedin } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { ImageWithPlaceholder } from "@/components/ui/ImageWithPlaceholder";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProximityGroup } from "@/components/motion/ProximityGroup";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { board } from "@/content/board";
// react-icons' bundled Font Awesome brand icon, not Simple Icons: Simple
// Icons dropped LinkedIn's mark after a takedown request (see Footer.tsx's
// identical use of FaLinkedin for the same reason).
//
// A deliberate, named exception to "hover enhances, hover never hides"
// (docs/design-system.md), scoped to exactly this element: the mark flies
// in on hover/focus for a pointer that can actually hover, but stays
// permanently visible everywhere else — touch (no hover to enhance),
// keyboard-only without a hovering pointer, and prefers-reduced-motion —
// via the .linkedin-mark rule in globals.css, which only hides-then-reveals
// inside `@media (hover: hover) and (min-width: 768px) and
// (prefers-reduced-motion: no-preference)`. Name and role are never gated
// by any of this, only the icon.
//
// The pointer-proximity lift/saturation (ProximityGroup, `proximity-item` +
// `data-portrait` below) is a separate, purely decorative layer on top: it's
// disabled outright on touch and under reduced motion (ProximityGroup never
// attaches a listener there).
const LINKEDIN_MARK_CLASSES =
  "linkedin-mark absolute left-2 top-2 flex items-center justify-center rounded-full bg-paper/90 p-2 text-ink";

// Zoom lands on the crop itself (this Placeholder/photo), never on
// data-portrait or the card around it — docs/design-system.md's Interaction
// section: "no layout shift". data-portrait's own overflow-hidden (above) is
// what turns the scale into a crop instead of the image spilling over its
// neighbors. `motion-safe` because the blanket reduced-motion rule in
// globals.css only shortens the transition — without it the zoom would still
// land, instantly.
const PORTRAIT_ZOOM_CLASSES =
  "transition-transform duration-[var(--duration-calm)] ease-signature motion-safe:desktop-hover:group-hover:scale-[1.06] motion-safe:desktop-hover:group-focus-within:scale-[1.06]";

// member.slug is a validated string (content/board.ts), not a literal union,
// so next-intl's typed message keys can't statically confirm it names a real
// "Board.<slug>" entry — cast, the same way Footer.tsx casts `item.key` to
// `RouteKey` for the same reason.
type BoardBioKey = Parameters<ReturnType<typeof useTranslations<"Board">>>[0];

export function BoardGrid() {
  const t = useTranslations("BoardGrid");
  const tBoard = useTranslations("Board");

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
                  <ImageLightbox src={member.photo} alt={member.name} triggerClassName="absolute inset-0">
                    <ImageWithPlaceholder
                      src={member.photo}
                      alt={member.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      className={PORTRAIT_ZOOM_CLASSES}
                    />
                  </ImageLightbox>
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
                    <FaLinkedin aria-hidden="true" className="size-4" />
                  </a>
                ) : null}
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
