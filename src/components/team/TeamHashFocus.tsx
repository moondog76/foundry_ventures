"use client";

/**
 * Keyboard follow-through for the `#slug` anchors on `/team` (§10.1, §20.2).
 *
 * A hash link moves the *viewport* but not the *focus point*: after activating
 * "Julia Siljehag" in the jump list, the next Tab would continue from the jump
 * list, not from Julia's section. This moves focus to the heading of the target
 * section so keyboard and screen-reader users continue reading where they asked
 * to be.
 *
 * The contract that keeps it safe:
 *  - the anchors are ordinary `<a href="#slug">` links and the headings already
 *    carry `tabindex="-1"` in the server markup, so with JavaScript disabled the
 *    page still navigates, still updates the URL and is still shareable. This
 *    component only adds the focus move;
 *  - `preventScroll` is used because the browser has already scrolled to the
 *    target (honouring `scroll-margin-top`); focusing again without it would
 *    fight that and can land the heading under the fixed header;
 *  - it only ever focuses an element marked as a team anchor heading, so a hash
 *    that points anywhere else is ignored instead of stealing focus.
 */

import { useEffect } from "react";

/** Set by `TeamMemberSection` on the person's `<h2>`. */
const HEADING_SELECTOR = "[data-team-anchor-heading]";

function readHashId(): string | null {
  const { hash } = window.location;
  if (hash.length < 2) return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    // A malformed escape sequence is not a valid id; treat it as no hash.
    return null;
  }
}

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function TeamHashFocus() {
  useEffect(() => {
    const focusFromHash = () => {
      const id = readHashId();
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      const heading = target.matches(HEADING_SELECTOR)
        ? (target as HTMLElement)
        : target.querySelector<HTMLElement>(HEADING_SELECTOR);
      if (!heading) return;

      heading.focus({ preventScroll: true });
    };

    // Deep link: the browser scrolls on load, we take focus with it. Deferred a
    // frame so this runs after the browser's own hash scrolling has settled.
    const frame = window.requestAnimationFrame(focusFromHash);

    const handleHashChange = () => focusFromHash();

    /*
     * Re-activating the anchor that is already in the URL fires no `hashchange`
     * (the browser still re-scrolls). Without this, clicking the same name twice
     * would scroll but leave focus behind.
     */
    const handleClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event)) return;
      const node = event.target instanceof Element ? event.target : null;
      const anchor = node?.closest("a");
      if (!anchor) return;
      // Same-document hash links only — never a route change or an outbound link.
      if (!anchor.getAttribute("href")?.startsWith("#")) return;
      if (anchor.hash !== window.location.hash) return;
      window.requestAnimationFrame(focusFromHash);
    };

    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("click", handleClick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
