/**
 * UI primitives (§17.2).
 *
 * Every interactive primitive documents its default, hover, focus-visible,
 * active and disabled states in `ui.module.css`. All of these are server
 * components — only `Reveal` needs the client.
 */

import Link from "next/link";
import type { ComponentProps, ElementType, ReactNode } from "react";
import styles from "./ui.module.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export { cx };

/* --------------------------------------------------------------- Container */

export type ContainerProps = {
  children: ReactNode;
  /** `inner` caps at 1440px for text-dense blocks; `narrow` for long-form. */
  width?: "default" | "inner" | "narrow";
  flush?: boolean;
  className?: string;
  as?: ElementType;
};

export function Container({
  children,
  width = "default",
  flush = false,
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={cx(
        styles.container,
        width === "inner" && styles.containerInner,
        width === "narrow" && styles.containerNarrow,
        flush && styles.containerFlush,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ----------------------------------------------------------------- Section */

export type SectionProps = {
  children: ReactNode;
  id?: string;
  surface?: "light" | "dark" | "off-white" | "none";
  spacing?: "default" | "tight" | "loose";
  className?: string;
  as?: ElementType;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

export function Section({
  children,
  id,
  surface = "none",
  spacing = "default",
  className,
  as: Tag = "section",
  ...rest
}: SectionProps) {
  return (
    <Tag
      id={id}
      // Surfaces expose their polarity so focus rings and links can invert.
      data-surface={surface === "dark" ? "dark" : "light"}
      className={cx(
        styles.section,
        spacing === "tight" && styles.sectionTight,
        spacing === "loose" && styles.sectionLoose,
        surface === "dark" && styles.sectionDark,
        surface === "light" && styles.sectionLight,
        surface === "off-white" && styles.sectionOffWhite,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------- Grid */

export function Grid({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={cx(styles.grid, className)}>{children}</Tag>;
}

/* ---------------------------------------------------------------- Eyebrow */

export function SectionEyebrow({
  children,
  onDark = false,
  id,
  className,
}: {
  children: ReactNode;
  onDark?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <p
      id={id}
      className={cx(styles.eyebrow, "type-label", onDark && styles.eyebrowOnDark, className)}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------- ButtonLink */

export type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  onDark?: boolean;
  full?: boolean;
  className?: string;
  /** Set for verified external destinations; adds rel and the arrow affordance. */
  external?: boolean;
  prefetch?: boolean;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  onDark = false,
  full = false,
  className,
  external = false,
  prefetch,
  ...rest
}: ButtonLinkProps) {
  const classes = cx(
    styles.button,
    variant === "secondary" && styles.buttonSecondary,
    onDark && styles.buttonOnDark,
    full && styles.buttonFull,
    className,
  );

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
        <ExternalIcon />
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} prefetch={prefetch} {...rest}>
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------------- TextLink */

export type TextLinkProps = {
  href: string;
  children: ReactNode;
  /** Renders the underline permanently, for the current route (§6.1). */
  active?: boolean;
  /** Inverts the rule and text colour for placement on a dark surface. */
  onDark?: boolean;
  className?: string;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

export function TextLink({
  href,
  children,
  active = false,
  onDark = false,
  className,
  ...rest
}: TextLinkProps) {
  return (
    <Link
      href={href}
      className={cx(
        styles.textLink,
        active && styles.textLinkActive,
        onDark && styles.textLinkOnDark,
        className,
      )}
      aria-current={active ? "page" : undefined}
      {...rest}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------- ExternalIcon */

export function ExternalIcon() {
  return (
    <svg
      className={styles.externalIcon}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 9L9 3" />
      <path d="M4 3h5v5" />
    </svg>
  );
}

/* --------------------------------------------------------------------- Tag */

export function Tag({
  children,
  onDark = false,
  accent = false,
  className,
}: {
  children: ReactNode;
  onDark?: boolean;
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(styles.tag, onDark && styles.tagOnDark, accent && styles.tagAccent, className)}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Divider */

export function Divider({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  return <hr className={cx(styles.divider, onDark && styles.dividerOnDark, className)} />;
}

/* -------------------------------------------------------------- EmptyState */

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <h3 className="type-heading-4">{title}</h3>
      <p className="type-body">{description}</p>
      {actions ? <div className={styles.emptyStateActions}>{actions}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------- Pagination */

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  label = "Pagination",
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className={styles.pagination} aria-label={label}>
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        className={cx(styles.paginationLink, currentPage === 1 && styles.paginationDisabled)}
        aria-disabled={currentPage === 1 || undefined}
        rel="prev"
      >
        <span aria-hidden="true">←</span>
        <span className="visually-hidden">Previous page</span>
      </Link>
      <ul className={styles.paginationList}>
        {pages.map((page) => (
          <li key={page}>
            <Link
              href={buildHref(page)}
              className={cx(
                styles.paginationLink,
                page === currentPage && styles.paginationCurrent,
              )}
              aria-current={page === currentPage ? "page" : undefined}
            >
              <span className="visually-hidden">Page </span>
              {page}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        className={cx(
          styles.paginationLink,
          currentPage === totalPages && styles.paginationDisabled,
        )}
        aria-disabled={currentPage === totalPages || undefined}
        rel="next"
      >
        <span aria-hidden="true">→</span>
        <span className="visually-hidden">Next page</span>
      </Link>
    </nav>
  );
}

export { styles as uiStyles };
