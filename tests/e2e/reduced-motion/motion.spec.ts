/**
 * §26.3 critical flow 11 — `prefers-reduced-motion: reduce`.
 *
 * The reveal system is opt-in from the client: server markup is always visible,
 * and `Reveal` only *adds* a hidden state after mount. Under reduced motion it
 * must skip that step entirely, so nothing a reader needs is ever left at
 * `opacity: 0` waiting for an IntersectionObserver that will not fire.
 *
 * The second promise is that nothing moves on its own. There is no autoplay
 * anywhere on the site — no timer, no `setInterval` in the carousel — so a
 * slideshow must never advance while the page is simply left alone.
 *
 * This project runs with `reducedMotion: "reduce"`, which sets the media feature
 * for the whole browser context.
 */

import { expect, test, type Page } from "@playwright/test";

const ROUTES = ["/", "/portfolio", "/team", "/pitch"] as const;

/**
 * Text-bearing elements whose own computed opacity is zero.
 *
 * Deliberately narrow: `aria-hidden` subtrees are excluded because the site uses
 * them for genuinely decorative layers (the cross-faded logo variant that is not
 * the current one, the typographic image fallback whose text is duplicated as a
 * real heading next to it), and `.visually-hidden` content is excluded because
 * it is meant for screen readers and is clipped rather than faded.
 */
async function invisibleContent(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const offenders: string[] = [];
    const candidates = document.querySelectorAll<HTMLElement>(
      "h1, h2, h3, h4, p, li, a, button, figure, blockquote",
    );

    for (const element of candidates) {
      if (element.closest('[aria-hidden="true"]')) continue;
      if (element.closest(".visually-hidden")) continue;
      const text = element.textContent?.trim();
      if (!text) continue;

      const style = window.getComputedStyle(element);
      // `display: none` content is not "invisible content" — it is absent, which
      // is a layout decision (a collapsed filter panel) rather than a stranded
      // reveal.
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (Number(style.opacity) !== 0) continue;

      offenders.push(`${element.tagName.toLowerCase()}: ${text.slice(0, 60)}`);
    }
    return offenders;
  });
}

for (const route of ROUTES) {
  test(`${route} shows its content immediately under reduced motion`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);

    // Every `Reveal` resolves straight to "visible"; none may be left pending,
    // which is the state that carries `opacity: 0`.
    await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);

    const offenders = await invisibleContent(page);
    expect(offenders, `content left at opacity 0 on ${route}:\n${offenders.join("\n")}`).toEqual(
      [],
    );

    // And it stays true below the fold, where the reveal would normally wait for
    // an intersection.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);

    const offendersAfterScroll = await invisibleContent(page);
    expect(
      offendersAfterScroll,
      `content left at opacity 0 after scrolling ${route}:\n${offendersAfterScroll.join("\n")}`,
    ).toEqual([]);
  });
}

test("nothing on the home page advances on its own", async ({ page }) => {
  await page.goto("/");

  const carousel = page.getByRole("group", { name: /testimonial/i });
  const hasCarousel = (await carousel.count()) > 0;

  if (!hasCarousel) {
    /*
     * With one consented testimonial the component renders a static quote and no
     * controls at all — "a carousel of one is a lie about the amount of
     * content". There is then nothing that *could* autoplay, which satisfies the
     * requirement rather than dodging it, so the assertion below covers the
     * whole page instead.
     */
    const readMain = () => page.locator("main").innerText();
    const before = await readMain();
    await page.waitForTimeout(3_000);
    // Rendered text rather than markup: an image finishing its decode changes
    // attributes, and that is not the page moving.
    expect(await readMain(), "the page must not change itself while it is left alone").toBe(before);
    return;
  }

  // A real carousel: the current slide must be the same one three seconds later.
  const currentSlide = () =>
    carousel
      .first()
      .locator('[aria-hidden="false"][aria-roledescription="slide"]')
      .getAttribute("aria-label");

  const before = await currentSlide();
  await page.waitForTimeout(3_000);
  expect(await currentSlide(), "the carousel must not autoplay").toBe(before);

  // It still moves when the reader asks it to.
  await carousel.first().focus();
  await page.keyboard.press("ArrowRight");
  expect(await currentSlide()).not.toBe(before);
});

test("scroll behaviour is not animated under reduced motion", async ({ page }) => {
  await page.goto("/");

  // `global.css` only enables smooth scrolling under
  // `prefers-reduced-motion: no-preference`, so here the computed value must be
  // the browser default. A smooth scroll is motion the reader did not ask for.
  const scrollBehavior = await page.evaluate(
    () => window.getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scrollBehavior).toBe("auto");
});

test("the reveal transition is collapsed rather than merely shortened", async ({ page }) => {
  await page.goto("/portfolio");

  // The duration tokens drop to 1ms under reduced motion, so a revealed element
  // can never be caught mid-transition.
  const revealDuration = await page.evaluate(() =>
    window.getComputedStyle(document.documentElement).getPropertyValue("--duration-reveal").trim(),
  );
  expect(revealDuration).toBe("1ms");
});
