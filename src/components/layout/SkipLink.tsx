import { useTranslations } from "next-intl";

export type SkipLinkProps = {
  targetId?: string;
};

// Must be the first focusable element in the document. focus:fixed is
// load-bearing: focus:not-sr-only alone resets to position: static, which
// would push page content down when focused — the exact layout shift the
// rest of the shell is built to avoid.
export function SkipLink({ targetId = "inhalt" }: SkipLinkProps) {
  const t = useTranslations("SkipLink");

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-body-s focus:text-paper"
    >
      {t("label")}
    </a>
  );
}
