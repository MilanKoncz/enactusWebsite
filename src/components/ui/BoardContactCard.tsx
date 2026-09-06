import Image from "next/image";
import { buttonClasses } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import type { BoardMember } from "@/content/board";

export type BoardContactCardProps = {
  member: BoardMember;
  eyebrow: string;
  title: string;
  lead: string;
  cta: string;
  className?: string;
};

/**
 * The "direct contact" card originally built for IdeathonFaq.tsx, extracted
 * once /innolab needed the identical block (same purpose: point a page's
 * open questions at one named board member rather than a generic contact
 * form). Sticky positioning stays out of this component and in each
 * consumer's `className` — it depends on that page's own grid, not on the
 * card itself.
 */
export function BoardContactCard({ member, eyebrow, title, lead, cta, className }: BoardContactCardProps) {
  return (
    <aside
      className={cn(
        "h-fit rounded-md border border-ink/10 bg-paper p-6 shadow-[0_8px_40px_rgba(19,28,50,0.04)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="text-heading-3 font-medium">{title}</h3>
        <p className="text-body-s opacity-80">{lead}</p>
        <div className="flex items-center gap-3 border-y border-ink/10 py-4">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-ink/5">
            {member.photo && <Image src={member.photo} alt="" fill sizes="48px" className="object-cover" />}
          </span>
          <div className="flex flex-col">
            <span className="text-body-s font-medium">{member.name}</span>
            <span className="text-body-s opacity-70">{member.role}</span>
          </div>
        </div>
        {member.email && (
          <a href={`mailto:${member.email}`} className={buttonClasses("secondary", "md")}>
            {cta}
          </a>
        )}
      </div>
    </aside>
  );
}
