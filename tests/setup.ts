/**
 * Shared test environment setup.
 *
 * jsdom implements no layout engine and only part of the CSSOM, so a handful of
 * browser APIs the components legitimately rely on are missing. Each stub below
 * exists because a real component would otherwise be untestable — none of them
 * changes what the component asserts about itself.
 */

import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

/* ------------------------------------------------------------- matchMedia */

/**
 * `Reveal` (and anything else honouring `prefers-reduced-motion`) calls
 * `window.matchMedia`, which jsdom does not implement at all. The stub reports
 * "no preference" for every query, which is the default a browser reports too;
 * a test that needs `prefers-reduced-motion: reduce` overrides it locally.
 */
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => {
      const list: MediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      };
      return list;
    },
  });
}

/* ------------------------------------------------------------ offsetParent */

/**
 * jsdom always reports `offsetParent === null` because it never lays anything
 * out. Two production behaviours read it as "is this element actually on
 * screen?": the mobile dialog's Tab trap and the portfolio panel's Escape
 * handler. Without an approximation both would see an empty world and silently
 * do nothing, so the test would pass against a broken implementation.
 *
 * The approximation is deliberately conservative: an element is considered laid
 * out unless it, or an ancestor, is explicitly hidden.
 */
function isLaidOut(element: HTMLElement): boolean {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (node.hidden) return false;
    if (node.style.display === "none") return false;
  }
  return true;
}

Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get(this: HTMLElement): Element | null {
    return isLaidOut(this) ? this.parentElement : null;
  },
});

/* -------------------------------------------------------------- scrolling */

/**
 * jsdom defines both of these but implements neither, and its stub logs a
 * "Not implemented" error to the virtual console on every call. Replacing them
 * with real no-ops keeps the output readable and, more importantly, makes them
 * spy-able: scroll restoration is asserted through `vi.spyOn(window, "scrollTo")`.
 */
Object.defineProperty(window, "scrollTo", {
  writable: true,
  configurable: true,
  value: () => undefined,
});

Element.prototype.scrollIntoView = () => undefined;

/* ------------------------------------------------------------- lifecycle */

afterEach(() => {
  // `restoreMocks` handles spies; timers are opt-in per test and must not leak
  // a fake clock into the next file.
  vi.useRealTimers();
});
