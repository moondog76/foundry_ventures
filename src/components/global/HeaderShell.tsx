"use client";

/**
 * Header behaviour (§6.1, §19.1).
 *
 * - Fixed by default, matching the live site.
 * - Transparent with the white logotype while sitting over the home hero;
 *   solid, compact and light on every other surface and after scroll.
 * - The surface transition (~300ms) and the compaction (~140ms) are separate so
 *   neither causes a layout shift; the header's own height is published as
 *   `--header-height` for `scroll-margin-top` consumers (§6.2).
 * - Below 992px the navigation collapses into a real dialog (§18.2).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { NavItem } from "@/content/types";
import { track } from "@/lib/analytics";
import { MobileNavigationDialog } from "./MobileNavigationDialog";
import { LinkedInIcon } from "./icons";
import styles from "./site-header.module.css";

export type HeaderShellProps = {
  navItems: NavItem[];
  linkedinUrl: string;
  brandName: string;
  logoOnDark: ReactNode;
  logoOnLight: ReactNode;
  logoCompactOnDark: ReactNode;
  logoCompactOnLight: ReactNode;
  logoMobileOnDark: ReactNode;
  logoMobileOnLight: ReactNode;
};

/**
 * Routes whose first section runs full bleed beneath the header, so the header
 * starts transparent over it. Only the home hero is built that way; every other
 * page offsets `main` by the header height instead (see `global.css`), and a
 * transparent header there would float over ordinary content.
 */
const TRANSPARENT_ROUTES = new Set(["/"]);

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Scroll position is external state, so it is read through
 * `useSyncExternalStore` rather than mirrored into React state from an effect.
 * The server snapshot is `false`: markup renders in the transparent-over-hero
 * state and corrects itself on hydration without a flash.
 */
function subscribeToScroll(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const SCROLL_THRESHOLD_PX = 24;

function getScrolledSnapshot(): boolean {
  return window.scrollY > SCROLL_THRESHOLD_PX;
}

function getScrolledServerSnapshot(): boolean {
  return false;
}

export function HeaderShell({
  navItems,
  linkedinUrl,
  brandName,
  logoOnDark,
  logoOnLight,
  logoCompactOnDark,
  logoCompactOnLight,
  logoMobileOnDark,
  logoMobileOnLight,
}: HeaderShellProps) {
  const pathname = usePathname() ?? "/";
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrolledSnapshot,
    getScrolledServerSnapshot,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Navigating closes the menu; the trigger regains focus (§18.2). Adjusted
  // during render rather than in an effect so the closed menu is part of the
  // same commit as the new route, with no intermediate frame showing it open.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  const overHero = TRANSPARENT_ROUTES.has(pathname);
  const transparent = overHero && !scrolled;

  const pitchItem = navItems.find((item) => item.href === "/pitch");
  const primaryItems = navItems.filter((item) => item.href !== "/pitch");

  return (
    <>
      <header
        className={styles.header}
        data-transparent={transparent ? "true" : "false"}
        data-compact={scrolled ? "true" : "false"}
        data-surface={transparent ? "dark" : "light"}
      >
        <div className={styles.inner}>
          <Link
            href="/"
            className={styles.logoLink}
            aria-label={`${brandName} — home`}
            onClick={() => track({ name: "nav_click", destination: "/", placement: "header" })}
          >
            {/* Both variants are rendered and cross-faded so the swap cannot flash. */}
            <span className={styles.logoOnDark} aria-hidden={!transparent}>
              <span className={styles.logoLarge}>{logoOnDark}</span>
              <span className={styles.logoCompact}>{logoCompactOnDark}</span>
              <span className={styles.logoMobile}>{logoMobileOnDark}</span>
            </span>
            <span className={styles.logoOnLight} aria-hidden={transparent}>
              <span className={styles.logoLarge}>{logoOnLight}</span>
              <span className={styles.logoCompact}>{logoCompactOnLight}</span>
              <span className={styles.logoMobile}>{logoMobileOnLight}</span>
            </span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary">
            <ul className={styles.navList}>
              {primaryItems.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={styles.navLink}
                      data-active={active ? "true" : undefined}
                      aria-current={active ? "page" : undefined}
                      onClick={() =>
                        track({
                          name: "nav_click",
                          destination: item.href,
                          placement: "header",
                        })
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.actions}>
            {/* Omitted entirely when no verified URL exists — an empty href
                resolves to the current page and is worse than no link. */}
            {linkedinUrl ? (
              <a
                href={linkedinUrl}
                className={styles.iconLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${brandName} on LinkedIn (opens in a new tab)`}
              >
                <LinkedInIcon />
              </a>
            ) : null}

            {pitchItem ? (
              <Link
                href={pitchItem.href}
                className={styles.cta}
                data-active={isActiveRoute(pathname, pitchItem.href) ? "true" : undefined}
                onClick={() => track({ name: "pitch_cta_click", placement: "header" })}
              >
                {pitchItem.label}
              </Link>
            ) : null}

            <button
              ref={triggerRef}
              type="button"
              className={styles.menuTrigger}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="visually-hidden">{menuOpen ? "Close menu" : "Open menu"}</span>
              <span
                className={styles.menuIcon}
                data-open={menuOpen ? "true" : "false"}
                aria-hidden="true"
              >
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileNavigationDialog
        id={menuId}
        open={menuOpen}
        navItems={navItems}
        linkedinUrl={linkedinUrl}
        brandName={brandName}
        pathname={pathname}
        onClose={() => setMenuOpen(false)}
        triggerRef={triggerRef}
      />
    </>
  );
}
