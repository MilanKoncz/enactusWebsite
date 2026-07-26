import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("rounded-md border border-ink/10 bg-paper p-6", className)} {...props}>
      {children}
    </div>
  );
}
