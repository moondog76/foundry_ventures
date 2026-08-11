"use client";

/**
 * Full-screen mobile navigation (§6.1, §18.2).
 *
 * State machine: closed → opening → open → closing → closed.
 *
 * The visual phase lives in a `data-state` attribute written imperatively,
 * not in React state: it is a transition on an external system (the DOM) that
 * never affects the tree, so driving it through state would only cause
 * cascading renders. React state tracks one thing — whether the dialog is
 * mounted — because the exit transition must finish before unmount.
 *
 * Accessibility contract:
 *  - a real `<button>` trigger with `aria-expanded`/`aria-controls` lives in the
 *    header; Luminar's inaccessible `div` trigger is explicitly not copied;
 *  - focus moves into the dialog on open, cycles inside it, and returns to the
 *    trigger on close;
 *  - Escape and the close button both close it;
 *  - body scroll is locked and the exact scroll position is restored;
 *  - the dialog is removed from the tree while closed, so screen readers never
 *    encounter duplicated navigation next to the desktop nav.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { NavItem } from "@/content/types";
import { track } from "@/lib/analytics";
import { LinkedInIcon } from "./icons";
import styles from "./mobile-nav.module.css";

export type MobileNavigationDialogProps = {
  id: string;
  open: boolean;
  navItems: NavItem[];
  linkedinUrl: string;
  brandName: string;
  pathname: string;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Must match the opacity transition in mobile-nav.module.css. */
const EXIT_DURATION_MS = 420;

export function MobileNavigationDialog({
  id,
  open,
  navItems,
  linkedinUrl,
  brandName,
  pathname,
  onClose,
  triggerRef,
}: MobileNavigationDialogProps) {
  const [mounted, setMounted] = useState(open);
  const [lastOpen, setLastOpen] = useState(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);
  const hasBeenOpen = useRef(false);

  // Opening must mount in the same commit as the prop change, so it is adjusted
  // during render rather than in an effect. Closing is deferred to the timer
  // below so the exit transition can play.
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setMounted(true);
  }

  /* ------------------------------------------------- visual phase (DOM only) */

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open) {
      hasBeenOpen.current = true;
      // Reading layout flushes the mounted (transparent) frame so the browser
      // has something to transition *from*.
      void node.getBoundingClientRect();
      node.dataset.state = "open";
    } else {
      node.dataset.state = "closing";
    }
  }, [open, mounted]);

  /* --------------------------------------------------------- deferred unmount */

  useEffect(() => {
    if (open || !mounted) return;
    // setState inside a timer callback, not synchronously in the effect body.
    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  /* ---------------------------------------------------------- scroll lock */

  useEffect(() => {
    if (!mounted) return;

    const body = document.body;
    scrollYRef.current = window.scrollY;
    body.dataset.scrollLocked = "true";
    body.style.top = `-${scrollYRef.current}px`;

    return () => {
      delete body.dataset.scrollLocked;
      body.style.top = "";
      // Restore the exact position the user left (§18.2).
      window.scrollTo(0, scrollYRef.current);
    };
  }, [mounted]);

  /* ----------------------------------------------- focus management + Esc */

  useEffect(() => {
    if (!open || !mounted) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const first = dialog.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === firstElement || active === dialog)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && active === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, mounted, onClose]);

  // Focus returns to the trigger once the dialog has fully unmounted.
  useEffect(() => {
    if (mounted || !hasBeenOpen.current) return;
    hasBeenOpen.current = false;
    triggerRef.current?.focus();
  }, [mounted, triggerRef]);

  const handleNavigate = useCallback(
    (href: string) => {
      track({ name: "nav_click", destination: href, placement: "mobile-menu" });
      onClose();
    },
    [onClose],
  );

  if (!mounted) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      id={id}
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      tabIndex={-1}
    >
      <nav className={styles.nav} aria-label="Mobile">
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.navLink}
                data-active={isActive(item.href) ? "true" : undefined}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => handleNavigate(item.href)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        {linkedinUrl ? (
          <a
            href={linkedinUrl}
            className={styles.socialLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkedInIcon />
            <span>{brandName} on LinkedIn</span>
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        ) : null}
        <button type="button" className={styles.closeButton} onClick={onClose}>
          Close menu
        </button>
      </div>
    </div>
  );
}
