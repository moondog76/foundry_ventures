"use client";

/**
 * "Clear all filters" for an archive's empty result state.
 *
 * A real `<a href="/insights">` so it works without JavaScript, upgraded to
 * `router.push(href, { scroll: false })` on a plain left click so it behaves
 * exactly like every other filter action (§18.1). Clearing the URL is all that
 * is needed — the filter component reads its state back from the URL.
 */

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { isPlainLeftClick } from "./link-intent";

export type FilterResetLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function FilterResetLink({ href, className, children }: FilterResetLinkProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return;
        event.preventDefault();
        startTransition(() => router.push(href, { scroll: false }));
      }}
    >
      {children}
    </a>
  );
}
