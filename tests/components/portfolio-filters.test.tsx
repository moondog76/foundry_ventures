/**
 * §26.2 — portfolio filters and the two empty states (§8.2, §8.3, §18.1).
 *
 * The URL is the source of truth, so every assertion here is ultimately about
 * the URL the component asks the router for: one `push` per explicit user
 * action (so Back walks one filter step at a time) and at most one `replace`,
 * only for a non-canonical incoming URL.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortfolioFilters } from "@/components/portfolio/PortfolioFilters";
import { PortfolioResults } from "@/components/portfolio/PortfolioResults";
import { buildCompanyFilterSchema } from "@/lib/filters/schemas";
import { PRODUCTION_POLICY } from "@/content/policy";
import type { FacetGroup } from "@/content/types";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/portfolio",
  useSearchParams: () => new URLSearchParams(),
}));

const FACETS: FacetGroup[] = [
  {
    key: "focus",
    legend: "Focus",
    control: "checkbox",
    options: [
      { slug: "b2b", title: "B2B", count: 5 },
      { slug: "b2c", title: "B2C", count: 3 },
    ],
  },
  {
    key: "status",
    legend: "Status",
    control: "checkbox",
    options: [
      { slug: "active", title: "Active", count: 6 },
      { slug: "exited", title: "Exited", count: 2 },
    ],
  },
];

const SCHEMA = buildCompanyFilterSchema({
  stage: [],
  sector: [],
  focus: ["b2b", "b2c"],
  status: ["active", "exited"],
});

type FilterProps = Partial<React.ComponentProps<typeof PortfolioFilters>>;

function renderFilters(props: FilterProps = {}) {
  return render(
    <PortfolioFilters
      basePath="/portfolio"
      facets={FACETS}
      schema={SCHEMA}
      initialState={{}}
      canonicalQuery=""
      didNormalize={false}
      resultCount={8}
      totalCount={8}
      {...props}
    />,
  );
}

beforeEach(() => {
  router.push.mockClear();
  router.replace.mockClear();
});

describe("portfolio filters", () => {
  it("renders real fieldsets, legends and checkboxes with unique ids", () => {
    const { container } = renderFilters();

    const fieldsets = container.querySelectorAll("fieldset");
    expect(fieldsets).toHaveLength(FACETS.length);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4);
    const ids = checkboxes.map((box) => box.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const box of checkboxes) expect(box).not.toBeChecked();
  });

  it("announces the result count in a polite live region", () => {
    renderFilters();

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("8 companies");
  });

  it("reports the filtered count against the total once something is selected", () => {
    renderFilters({
      initialState: { focus: ["b2b"] },
      canonicalQuery: "focus=b2b",
      resultCount: 3,
      totalCount: 8,
    });

    expect(screen.getByRole("status")).toHaveTextContent("3 of 8 companies");
  });

  it("selects a value, pushes the canonical URL and keeps focus on the control", async () => {
    const user = userEvent.setup();
    renderFilters();

    const b2b = screen.getByRole("checkbox", { name: /B2B/ });
    await user.click(b2b);

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith("/portfolio?focus=b2b", { scroll: false });
    expect(b2b).toBeChecked();
    // The same DOM node must survive the navigation, or the user loses their place.
    expect(document.activeElement).toBe(b2b);
  });

  it("ANDs a second group into the same URL", async () => {
    const user = userEvent.setup();
    renderFilters({ initialState: { focus: ["b2b"] }, canonicalQuery: "focus=b2b" });

    await user.click(screen.getByRole("checkbox", { name: /Active/ }));

    expect(router.push).toHaveBeenCalledWith("/portfolio?focus=b2b&status=active", {
      scroll: false,
    });
  });

  it("clears one value from its chip and leaves the rest of the URL intact", async () => {
    const user = userEvent.setup();
    renderFilters({
      initialState: { focus: ["b2b"], status: ["active"] },
      canonicalQuery: "focus=b2b&status=active",
      resultCount: 2,
    });

    const chip = screen.getByRole("link", { name: /Focus: B2B/ });
    // The chip is a real link so it still works without JavaScript.
    expect(chip).toHaveAttribute("href", "/portfolio?status=active");

    await user.click(chip);

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith("/portfolio?status=active", { scroll: false });
    expect(screen.getByRole("checkbox", { name: /B2B/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Active/ })).toBeChecked();
  });

  it("clears everything back to the bare pathname", async () => {
    const user = userEvent.setup();
    renderFilters({
      initialState: { focus: ["b2b", "b2c"], status: ["active"] },
      canonicalQuery: "focus=b2b&focus=b2c&status=active",
      resultCount: 4,
    });

    const clearAll = screen.getByRole("link", { name: "Clear all" });
    expect(clearAll).toHaveAttribute("href", "/portfolio");

    await user.click(clearAll);

    expect(router.push).toHaveBeenCalledWith("/portfolio", { scroll: false });
    for (const box of screen.getAllByRole("checkbox")) expect(box).not.toBeChecked();
  });

  it("shows no chips and no 'Clear all' while nothing is selected", () => {
    renderFilters();

    expect(screen.queryByRole("link", { name: "Clear all" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Focus:/ })).toBeNull();
  });

  it("normalises a non-canonical incoming URL exactly once", () => {
    renderFilters({
      initialState: { focus: ["b2b"] },
      canonicalQuery: "focus=b2b",
      didNormalize: true,
    });

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/portfolio?focus=b2b", { scroll: false });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not touch the URL when it already arrived canonical", () => {
    renderFilters({ initialState: { focus: ["b2b"] }, canonicalQuery: "focus=b2b" });

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("renders nothing at all when there are no facets to filter by", () => {
    const { container } = renderFilters({ facets: [] });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("still strips a stale query from a shared link when there are no facets", () => {
    // The hooks run even though nothing renders: an empty vocabulary rejects
    // every incoming param, so the one-shot replace clears "?stage=…".
    renderFilters({ facets: [], canonicalQuery: "", didNormalize: true });

    expect(router.replace).toHaveBeenCalledWith("/portfolio", { scroll: false });
  });
});

describe("portfolio zero states", () => {
  it("explains an over-filtered archive and offers a way out", () => {
    render(
      <PortfolioResults
        companies={[]}
        policy={PRODUCTION_POLICY}
        hasActiveFilters
        clearAllHref="/portfolio"
        headingId="portfolio-results"
      />,
    );

    expect(screen.getByText("No companies match these filters")).toBeInTheDocument();
    const clear = screen.getByRole("link", { name: "Clear all filters" });
    expect(clear).toHaveAttribute("href", "/portfolio");
    expect(screen.getByRole("link", { name: "Pitch us" })).toHaveAttribute("href", "/pitch");
  });

  it("says plainly that nothing is published, rather than blaming a filter", () => {
    render(
      <PortfolioResults
        companies={[]}
        policy={PRODUCTION_POLICY}
        hasActiveFilters={false}
        clearAllHref="/portfolio"
        headingId="portfolio-results"
      />,
    );

    expect(screen.getByText("No portfolio companies are published yet")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear all filters" })).toBeNull();
  });

  it("routes 'Clear all filters' through the router without a full navigation", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioResults
        companies={[]}
        policy={PRODUCTION_POLICY}
        hasActiveFilters
        clearAllHref="/portfolio"
        headingId="portfolio-results"
      />,
    );

    await user.click(screen.getByRole("link", { name: "Clear all filters" }));

    expect(router.push).toHaveBeenCalledWith("/portfolio", { scroll: false });
  });

  it("renders one card per company when there are results", () => {
    render(
      <PortfolioResults
        companies={[
          {
            id: "c1",
            slug: "testcorp-fixture",
            name: "Testcorp Fixture",
            href: "/portfolio/testcorp-fixture",
            externalHref: null,
            logo: null,
            logoAlt: "Testcorp Fixture logo",
            logoFit: "contain",
            logoSurface: "dark" as const,
            opticalScale: 1,
            cardImage: null,
            tagline: null,
            stages: [],
            sectors: [],
            focuses: [],
            status: null,
            founders: [],
            featured: false,
            sortOrder: 10,
          },
        ]}
        policy={PRODUCTION_POLICY}
        hasActiveFilters={false}
        clearAllHref="/portfolio"
        headingId="portfolio-results"
      />,
    );

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Testcorp Fixture/ })).toBeInTheDocument();
  });
});
