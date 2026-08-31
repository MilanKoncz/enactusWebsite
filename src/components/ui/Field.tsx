"use client";

import { forwardRef, useId, useRef, useState } from "react";
import type { ClipboardEvent, ComponentPropsWithoutRef, ReactNode, Ref } from "react";
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
  /** Rendered inside the input's own relative wrapper, absolutely positioned
      on the right — same slot the select branch already reserves for its
      chevron, just interactive here (the password field's show/hide
      toggle). Adds the matching right-hand padding to the control itself so
      typed text never runs under it. */
  endAdornment?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"input">, keyof FieldOwnProps | "as">;

type FieldAsTextarea = FieldOwnProps & {
  as: "textarea";
  /** Shows a live "N / max" count under the field, read off this
      textarea's own `maxLength` — for a field whose character limit is
      part of the point (a keyword list, a short reason), not just a quiet
      server-side cap. Opt-in: most textareas on this site don't need one. */
  showCount?: boolean;
  /** Shown right under the count when a paste would have added more text
      than `maxLength` allows, so a visitor notices their text was cut
      instead of assuming everything they pasted made it in — the browser's
      own truncation is otherwise silent. Only meaningful together with
      `maxLength`; a field with no cap has nothing to truncate. */
  truncatedMessage?: string;
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

  // Declared unconditionally (React's rule of hooks), even though only the
  // textarea-with-showCount branch below ever reads it. Seeded from
  // defaultValue's length, not 0 — react-hook-form's register() sets a
  // registered field's initial content via its ref callback, bypassing
  // React's own controlled-value path entirely, so a plain onChange-driven
  // counter would otherwise start at 0 even when a default value is
  // already filled in.
  const [textareaLength, setTextareaLength] = useState(() => {
    const defaultValue = "as" in rest && rest.as === "textarea" ? rest.defaultValue : undefined;
    return typeof defaultValue === "string" ? defaultValue.length : 0;
  });

  // Set by handlePaste (below) the moment a paste is predicted to overflow
  // maxLength, and read once by the change handler that fires right after
  // it — a paste always fires as "paste" then "input" in that order, so the
  // ref is guaranteed to hold the right answer by the time onChange reads
  // it. Consumed (reset to false) on every change so a truncation notice
  // never survives past the edit that caused it.
  const pasteOverflowRef = useRef(false);
  const [truncated, setTruncated] = useState(false);

  const countId =
    rest.as === "textarea" && rest.showCount && typeof rest.maxLength === "number" ? `${controlId}-count` : undefined;
  const describedBy = [hintId, errorId, countId].filter(Boolean).join(" ") || undefined;

  const controlClassName = cn(
    CONTROL_BASE_CLASSES,
    error ? "border-oxblood" : "border-ink/20",
    className,
  );

  let control: ReactNode;
  let count: ReactNode = null;

  if (rest.as === "textarea") {
    const { as, showCount, truncatedMessage, onChange, onPaste, ...textareaProps } = rest;
    const maxLength = textareaProps.maxLength;

    function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
      if (typeof maxLength === "number") {
        const target = event.currentTarget;
        const pastedLength = event.clipboardData.getData("text").length;
        const replacedLength = target.selectionEnd - target.selectionStart;
        const prospectiveLength = target.value.length - replacedLength + pastedLength;
        pasteOverflowRef.current = prospectiveLength > maxLength;
      }
      onPaste?.(event);
    }

    control = (
      <textarea
        ref={ref as Ref<HTMLTextAreaElement>}
        id={controlId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(controlClassName, "min-h-32")}
        onPaste={handlePaste}
        onChange={(event) => {
          if (showCount) setTextareaLength(event.target.value.length);
          if (truncatedMessage) {
            setTruncated(pasteOverflowRef.current);
            pasteOverflowRef.current = false;
          }
          onChange?.(event);
        }}
        {...textareaProps}
      />
    );
    if (showCount && typeof maxLength === "number") {
      count = (
        <p id={countId} className="text-body-s opacity-60 tabular-nums" aria-live="polite">
          {textareaLength} / {maxLength}
        </p>
      );
    }
    if (truncated && truncatedMessage) {
      count = (
        <>
          {count}
          <p className="flex items-center gap-2 text-body-s text-oxblood" aria-live="polite">
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            {truncatedMessage}
          </p>
        </>
      );
    }
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
    const { as, endAdornment, ...inputProps } = rest;
    const inputEl = (
      <input
        ref={ref as Ref<HTMLInputElement>}
        id={controlId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(controlClassName, endAdornment && "pr-10")}
        {...inputProps}
      />
    );
    control = endAdornment ? (
      <div className="relative">
        {inputEl}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</div>
      </div>
    ) : (
      inputEl
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      <label htmlFor={controlId} className="text-body-s font-medium text-ink">
        {label}
      </label>
      {control}
      {count}
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
