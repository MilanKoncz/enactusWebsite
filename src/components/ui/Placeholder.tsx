import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type PlaceholderProps = {
  kind: string;
  /**
   * Omit where the placeholder sits right beside its own name already (an
   * accordion trigger showing both a leading icon-sized placeholder and the
   * format's title as text, say) — repeating the name a second time inside
   * a box small enough to be an icon has no room for it and only overflows.
   */
  label?: string;
  ratio?: string;
  note?: string;
  className?: string;
};

export function Placeholder({ kind, label, ratio, note, className }: PlaceholderProps) {
  const style: CSSProperties | undefined = ratio ? { aspectRatio: ratio } : undefined;
  return (
    <div
      style={style}
      className={cn(
        "flex flex-col items-center justify-center gap-2 overflow-hidden rounded-md border-2 border-dashed border-gold bg-gold/5 p-6 text-center",
        className,
      )}
    >
      <p className="font-mono text-mono-xs uppercase opacity-60">{kind}</p>
      {label && <p className="text-body-m text-ink">{label}</p>}
      {note && <p className="text-body-s opacity-60">{note}</p>}
    </div>
  );
}
