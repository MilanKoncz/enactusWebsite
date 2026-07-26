import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ContainerProps = ComponentPropsWithoutRef<"div">;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-content px-4 sm:px-6 lg:px-10", className)}
      {...props}
    />
  );
}
