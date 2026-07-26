/**
 * Single indirection point for the app's Link component — every consumer
 * (Button, Nav, Footer, ...) imports Link/LinkProps from here, never
 * "next-intl/navigation" or "next/link" directly.
 *
 * ComponentPropsWithoutRef (not ComponentProps) matters: next-intl's Link is a
 * forwardRef component, so ComponentProps would pull in `ref`, which then
 * collides with Button's own forwardRef ref and its `{...linkRest}` spread.
 * ComponentPropsWithoutRef keeps LinkProps["href"] as a plain string | UrlObject,
 * so Button's discriminated union compiles unchanged.
 *
 * RawLink (plain next/link) is exported alongside Link for one specific case:
 * LocaleSwitch must NOT use Link with an explicit `locale` prop — next-intl's
 * Link forces a prefix whenever `locale` is passed explicitly (verified in
 * navigation/shared/createSharedNavigationFns.js), which would prefix even the
 * default locale and turn every DE-switch link into a redirect. The switcher
 * instead computes the correct as-needed href with getPathname() and renders
 * it with RawLink.
 */
import type { ComponentPropsWithoutRef } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

export const { Link, getPathname, redirect, permanentRedirect, usePathname, useRouter } =
  createNavigation(routing);

export { default as RawLink } from "next/link";
export type LinkProps = ComponentPropsWithoutRef<typeof Link>;
