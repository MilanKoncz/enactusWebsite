import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProximityGroup } from "@/components/motion/ProximityGroup";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { board } from "@/content/board";

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
  "absolute left-2 top-2 rounded-sm bg-paper/90 px-2 py-0.5 text-mono-xs font-mono uppercase text-ink transition-opacity duration-200 desktop-hover:opacity-0 desktop-hover:group-hover:opacity-100 desktop-hover:group-focus-within:opacity-100";

export function BoardGrid() {
  const t = useTranslations("BoardGrid");
  const tPlaceholder = useTranslations("Placeholder");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="board" />
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ProximityGroup className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {board.map((member) => (
            <div key={member.slug} tabIndex={0} className="group proximity-item flex flex-col gap-3">
              <div data-portrait className="relative">
                <Placeholder kind="Foto" label={member.name} ratio="3 / 4" />
                {member.linkedinUrl ? (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("linkedinLabel", { name: member.name })}
                    className={LINKEDIN_MARK_CLASSES}
                  >
                    {t("linkedin")}
                  </a>
                ) : (
                  <PlaceholderMark hint={tPlaceholder("missingHint")} className={LINKEDIN_MARK_CLASSES}>
                    {t("linkedin")}
                  </PlaceholderMark>
                )}
              </div>
              <p className="text-body-m font-medium">
                <PlaceholderMark hint={tPlaceholder("missingHint")}>{member.name}</PlaceholderMark>
              </p>
              <p className="text-body-s opacity-60">
                <PlaceholderMark hint={tPlaceholder("missingHint")}>{member.role}</PlaceholderMark>
              </p>
            </div>
          ))}
        </ProximityGroup>
      </Container>
    </Section>
  );
}
