import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type PlaceholderProps = {
  kind: string;
  label: string;
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
        "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gold bg-gold/5 p-6 text-center",
        className,
      )}
    >
      <p className="font-mono text-mono-xs uppercase opacity-60">{kind}</p>
      <p className="text-body-m text-ink">{label}</p>
      {note && <p className="text-body-s opacity-60">{note}</p>}
    </div>
  );
}
