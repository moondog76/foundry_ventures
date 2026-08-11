/**
 * Click-intent guard for the archive filter affordances.
 *
 * Every filter control that *navigates* is a real `<a href>` so an archive still
 * works with JavaScript disabled and so "open in a new tab" keeps working. When
 * we do intercept the click we must first make sure the user did not ask the
 * browser for something else (new tab, new window, download, middle click).
 */

import type { MouseEvent } from "react";

export function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
