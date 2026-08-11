/**
 * §26.2 — the portfolio company card (§8.4, §20.1, §20.2).
 *
 * Three properties are load-bearing and all three are asserted here:
 *  1. the whole card is exactly one link, with a sensible accessible name;
 *  2. no information is available only on hover — everything the card knows is
 *     in the accessible name at rest, and focus adds nothing and removes
 *     nothing;
 *  3. every hover treatment has an identical `:focus-visible` counterpart. That
 *     last one lives in CSS, so it is asserted against the stylesheet itself
 *     rather than against computed styles jsdom cannot produce.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CompanyCard } from "@/components/portfolio/CompanyCard";
import { PREVIEW_POLICY, PRODUCTION_POLICY } from "@/content/policy";
import type { CompanySummary } from "@/content/types";

const BASE: CompanySummary = {
  id: "test-company",
  slug: "testcorp-fixture",
  name: "Testcorp Fixture",
  href: "/portfolio/testcorp-fixture",
  externalHref: null,
  // A null logo is the seed's real production state: the live logos are export
  // references whose binaries are not in the workspace.
  logo: null,
  logoAlt: "Testcorp Fixture logo",
  logoFit: "contain",
  opticalScale: 1,
  cardImage: null,
  tagline: "A synthetic record used only by the component tests.",
  stages: [{ group: "stage", slug: "pre-seed", title: "Pre-seed" }],
  sectors: [{ group: "sector", slug: "ai-infrastructure", title: "AI infrastructure" }],
  focuses: [],
  status: "active",
  founders: [],
  featured: false,
  sortOrder: 10,
};

function renderCard(overrides: Partial<CompanySummary> = {}) {
  return render(<CompanyCard summary={{ ...BASE, ...overrides }} policy={PRODUCTION_POLICY} />);
}

describe("company card destinations", () => {
  it("is exactly one internal link with a sensible accessible name", () => {
    const { container } = renderCard();

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/portfolio/testcorp-fixture");
    expect(link).toHaveAccessibleName(expect.stringContaining("Testcorp Fixture"));
    expect(link).not.toHaveAttribute("target");
  });

  it("falls back to the verified external site, marked as leaving the site", () => {
    const { container } = renderCard({ href: null, externalHref: "https://example.com/testcorp" });

    expect(container.querySelectorAll("a")).toHaveLength(1);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/testcorp");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName(expect.stringContaining("opens in a new tab"));
  });

  it("renders no link at all when neither destination is publishable", () => {
    const { container } = renderCard({ href: null, externalHref: null });

    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(screen.queryByRole("link")).toBeNull();
    // …and it must not look interactive either.
    expect(container.querySelector("article")).not.toHaveAttribute("data-interactive");
    // The name is still readable — the card degrades, it does not disappear.
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Testcorp Fixture");
  });
});

describe("company card information availability", () => {
  it("puts every published fact in the accessible name at rest", () => {
    renderCard();

    const link = screen.getByRole("link");
    const name = link.getAttribute("aria-label") ?? link.textContent ?? "";

    for (const fragment of [
      "Testcorp Fixture",
      "A synthetic record used only by the component tests.",
      "Pre-seed",
      "AI infrastructure",
      "Active",
    ]) {
      expect(name, `"${fragment}" must be readable without hovering`).toContain(fragment);
    }
  });

  it("shows and announces exactly the same content in the default and focused states", () => {
    const { container } = renderCard();
    const link = screen.getByRole("link");

    const before = { text: container.textContent, html: container.innerHTML };

    link.focus();
    expect(document.activeElement).toBe(link);

    // Focus is a CSS-only response: no node is added, removed or relabelled, so
    // a keyboard user is never shown less than a mouse user.
    expect(container.textContent).toBe(before.text);
    expect(container.innerHTML).toBe(before.html);
  });

  it("hides nothing behind a title attribute or an aria-hidden wrapper", () => {
    const { container } = renderCard();

    // `title` is a hover-only affordance and must never be the sole carrier of
    // a fact; the logo fallback is the only element allowed to be hidden,
    // because the same name is the card's heading.
    expect(container.querySelectorAll("[title]")).toHaveLength(0);

    const hidden = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    for (const element of hidden) {
      const text = element.textContent?.trim() ?? "";
      if (text === "") continue;
      expect(text).toBe("Testcorp Fixture");
    }
  });

  it("omits a field the policy layer did not publish, rather than filling it in", () => {
    renderCard({ tagline: null, stages: [], sectors: [], status: null });

    expect(screen.queryByText("—")).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Testcorp Fixture");
  });

  it("lists the tags as a real list so they are navigable", () => {
    renderCard();

    const tags = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(tags.map((item) => item.textContent)).toEqual([
      "Pre-seed",
      "AI infrastructure",
      "Active",
    ]);
  });

  it("renders the typographic fallback instead of a broken or unlicensed logo", () => {
    const { container } = renderCard({
      logo: {
        id: "export-reference",
        src: "https://cdn.example.com/logo.svg",
        width: 100,
        height: 100,
        rightsStatus: "approved",
        // The binary is not in the workspace: hotlinking it is out of scope.
        available: false,
      },
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe("Testcorp Fixture");
  });

  it("shows preview-only facts only in preview", () => {
    const inactive: CompanySummary = { ...BASE, status: "inactive" };

    const production = render(
      <CompanyCard summary={{ ...inactive, status: null }} policy={PRODUCTION_POLICY} />,
    );
    expect(production.container.textContent).not.toContain("Inactive");
    production.unmount();

    render(<CompanyCard summary={inactive} policy={PREVIEW_POLICY} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });
});

describe("company card hover / focus parity (stylesheet)", () => {
  // Vitest transforms test files through the dev server, so `import.meta.url`
  // is not a file URL here; the project root is the stable anchor.
  const cssPath = resolve(process.cwd(), "src/components/portfolio/company-card.module.css");
  const raw = readFileSync(cssPath, "utf8");
  // Comments would otherwise be swallowed into the following selector.
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");

  /** `selector { declarations }` pairs; @media wrappers contribute no match. */
  const RULE = /([^{}]+)\{([^{}]*)\}/g;

  function rules(): Array<{ selector: string; body: string }> {
    const found: Array<{ selector: string; body: string }> = [];
    for (const match of css.matchAll(RULE)) {
      found.push({
        selector: match[1].replace(/\s+/g, " ").trim(),
        body: match[2].replace(/\s+/g, " ").trim(),
      });
    }
    return found;
  }

  it("gives every hover treatment an identical :focus-visible counterpart", () => {
    const all = rules();
    const hoverRules = all.filter((rule) => rule.selector.includes(":hover"));

    // If this ever hits zero the assertion below stops proving anything.
    expect(hoverRules.length).toBeGreaterThan(0);

    for (const rule of hoverRules) {
      const focusSelector = rule.selector.replace(/:hover/g, ":focus-visible");
      const counterpart = all.find((candidate) => candidate.selector === focusSelector);

      expect(counterpart, `no :focus-visible counterpart for "${rule.selector}"`).toBeDefined();
      expect(counterpart?.body, `"${focusSelector}" differs from its hover rule`).toBe(rule.body);
    }
  });

  it("gates hover behind a hover-capable pointer so a tap does not latch", () => {
    expect(raw).toContain("@media (hover: hover) and (pointer: fine)");
  });

  it("drops the underline transition under prefers-reduced-motion", () => {
    expect(raw).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
