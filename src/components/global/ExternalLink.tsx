/**
 * External link (§18.4).
 *
 * Sanitises the protocol, marks the destination visually and in the accessible
 * name, and applies `rel="noopener noreferrer"` whenever it opens a new tab.
 */

import type { ReactNode } from "react";
import { sanitizeUrl } from "@/lib/security/url";
import { ExternalIcon, cx, uiStyles } from "@/components/ui";

export type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  newTab?: boolean;
  className?: string;
  showIcon?: boolean;
  "aria-label"?: string;
  "data-analytics"?: string;
};

export function ExternalLink({
  href,
  children,
  newTab = true,
  className,
  showIcon = true,
  ...rest
}: ExternalLinkProps) {
  const safeHref = sanitizeUrl(href);
  // A blocked protocol renders as plain text rather than a dead or unsafe link.
  if (!safeHref) return <span className={className}>{children}</span>;

  return (
    <a
      href={safeHref}
      className={cx(uiStyles.textLink, className)}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {showIcon ? <ExternalIcon /> : null}
      {newTab ? <span className="visually-hidden"> (opens in a new tab)</span> : null}
    </a>
  );
}
