/**
 * Shared end-to-end helpers.
 *
 * Everything here is deliberately small and explicit: a helper that hides an
 * assertion makes a failure harder to read, so these return values or perform
 * exactly one narrowly-scoped check.
 */

import { expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The conformance tags §26.4 requires. Anything reported under these is a
 * genuine accessibility defect, not a style preference.
 */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] as const;

/**
 * Scans the current page and asserts zero violations.
 *
 * The failure message names the rule and the offending selectors, because an
 * axe failure with only a count is close to useless when you are reading CI
 * output rather than the HTML report.
 */
export async function expectNoAxeViolations(page: Page, context: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();

  const summary = results.violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => node.target.join(" ")).join("\n      ");
      return `  ${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n      ${nodes}`;
    })
    .join("\n");

  expect(results.violations, `axe violations on ${context}:\n${summary}`).toEqual([]);
}

/**
 * §26.6: the document must never be wider than the viewport. One CSS pixel of
 * slack absorbs sub-pixel rounding in scrollWidth, which is an integer.
 */
export async function expectNoHorizontalOverflow(page: Page, context: string): Promise<void> {
  const measurement = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));

  expect(
    measurement.scrollWidth,
    `${context} overflows horizontally: documentElement.scrollWidth=${measurement.scrollWidth} > window.innerWidth=${measurement.innerWidth}`,
  ).toBeLessThanOrEqual(measurement.innerWidth + 1);
}

/** A readable description of whatever currently has focus. */
/**
 * True when the given locator resolves to the focused element.
 *
 * `expect(locator).toBeFocused()` covers most cases; this exists for the ones it
 * cannot express, such as a container with `tabindex="-1"` that took focus
 * programmatically and needs to be asserted inside a wider expectation.
 */
export async function isFocused(locator: Locator): Promise<boolean> {
  return locator.evaluate((node) => node === document.activeElement);
}

/**
 * A distinct client address for this test.
 *
 * `/api/pitch` rate-limits five submissions per hour per hashed address
 * (`clientAddressFrom` reads `x-forwarded-for`). Without this, a retried run —
 * or simply running the suite twice inside an hour — would start getting 429s
 * from a server process that is still holding the previous window.
 */
export function uniqueForwardedFor(): string {
  // 198.18.0.0/15 is the RFC 2544 benchmarking range: reserved, never routed,
  // and wide enough that two parallel workers will not collide.
  const octet = () => Math.floor(Math.random() * 254) + 1;
  return `198.18.${octet()}.${octet()}`;
}

/** Every `<h1>` currently in the document. Exactly one is the contract (§6.2). */
export async function headingLevelOneTexts(page: Page): Promise<string[]> {
  return page.locator("h1").allTextContents();
}
