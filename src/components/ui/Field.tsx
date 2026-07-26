import { forwardRef, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type FieldOwnProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
};

type FieldAsInput = FieldOwnProps & {
  as?: "input";
} & Omit<ComponentPropsWithoutRef<"input">, keyof FieldOwnProps | "as">;

type FieldAsTextarea = FieldOwnProps & {
  as: "textarea";
} & Omit<ComponentPropsWithoutRef<"textarea">, keyof FieldOwnProps | "as">;

type FieldAsSelect = FieldOwnProps & {
  as: "select";
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"select">, keyof FieldOwnProps | "as" | "children">;

export type FieldProps = FieldAsInput | FieldAsTextarea | FieldAsSelect;

const CONTROL_BASE_CLASSES =
  "w-full rounded-md border bg-paper px-4 py-2 text-body-m text-ink placeholder:text-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

export const Field = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FieldProps
>(function Field({ label, hint, error, className, containerClassName, id, ...rest }, ref) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const showHint = Boolean(hint) && !error;
  const hintId = showHint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const controlClassName = cn(
    CONTROL_BASE_CLASSES,
    error ? "border-oxblood" : "border-ink/20",
    className,
  );

  let control: ReactNode;

  if (rest.as === "textarea") {
    const { as, ...textareaProps } = rest;
    control = (
      <textarea
        ref={ref as Ref<HTMLTextAreaElement>}
        id={controlId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(controlClassName, "min-h-32")}
        {...textareaProps}
      />
    );
  } else if (rest.as === "select") {
    const { as, ...selectProps } = rest;
    control = (
      <div className="relative">
        <select
          ref={ref as Ref<HTMLSelectElement>}
          id={controlId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(controlClassName, "appearance-none pr-10")}
          {...selectProps}
        />
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink/60"
        />
      </div>
    );
  } else {
    const { as, ...inputProps } = rest;
    control = (
      <input
        ref={ref as Ref<HTMLInputElement>}
        id={controlId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={controlClassName}
        {...inputProps}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      <label htmlFor={controlId} className="text-body-s font-medium text-ink">
        {label}
      </label>
      {control}
      {showHint && (
        <p id={hintId} className="text-body-s opacity-60">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-2 text-body-s text-oxblood">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});
