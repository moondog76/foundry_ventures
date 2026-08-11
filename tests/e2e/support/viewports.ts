/**
 * The required viewport matrix (§26.6).
 *
 * Documented as data rather than as eight Playwright projects: every entry is
 * checked for horizontal overflow by `desktop/layout.spec.ts` inside one browser
 * context, which is an order of magnitude cheaper than eight browser launches
 * and keeps the matrix in one readable place.
 *
 * The widths are the breakpoint boundaries the build contract defines
 * (tiny 320–479 · mobile 480–767 · tablet 768–991 · desktop 992–1439 · wide
 * 1440+) plus the two device sizes the design was drawn against.
 */

export type Viewport = {
  name: string;
  width: number;
  height: number;
  /** What this size is meant to prove. Printed in the test title. */
  note: string;
};

export const VIEWPORT_MATRIX: readonly Viewport[] = [
  { name: "320x568", width: 320, height: 568, note: "smallest supported phone" },
  { name: "375x812", width: 375, height: 812, note: "common phone" },
  { name: "390x844", width: 390, height: 844, note: "design reference phone" },
  { name: "768x1024", width: 768, height: 1024, note: "tablet — filter panel becomes permanent" },
  { name: "1024x768", width: 1024, height: 768, note: "tablet landscape — desktop nav appears" },
  { name: "1280x720", width: 1280, height: 720, note: "laptop" },
  { name: "1440x900", width: 1440, height: 900, note: "design reference desktop" },
  { name: "1920x1080", width: 1920, height: 1080, note: "wide" },
] as const;

/** Routes that must survive every width in the matrix without overflowing. */
export const LAYOUT_ROUTES = ["/", "/portfolio", "/team", "/pitch"] as const;
