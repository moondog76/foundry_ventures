/**
 * §26.2 — the site header's active-route state (§6.1).
 *
 * The underline is a CSS response to `data-active`, and the same condition
 * drives `aria-current="page"`, so asserting the attributes asserts both the
 * visual and the announced state. A detail route has to keep its parent index
 * marked — that is the part that regresses when someone switches to an equality
 * check on `pathname`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HeaderShell } from "@/components/global/HeaderShell";
import type { NavItem } from "@/content/types";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const NAV_ITEMS: NavItem[] = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Team", href: "/team" },
  { label: "Insights", href: "/insights" },
  { label: "Pitch", href: "/pitch" },
];

function renderHeader(currentPath: string) {
  pathname.current = currentPath;
  const slot = (key: string) => <span data-testid={key} />;
  return render(
    <HeaderShell
      navItems={NAV_ITEMS}
      linkedinUrl="https://www.linkedin.com/company/foundry-ventures-ai/"
      brandName="Foundry Ventures"
      logoOnDark={slot("logo-dark")}
      logoOnLight={slot("logo-light")}
    />,
  );
}

/** The primary nav only — the mobile dialog is not mounted in these tests. */
const primaryNav = () => screen.getByRole("navigation", { name: "Primary" });

beforeEach(() => {
  Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
});

describe("site header", () => {
  it("marks the index route it is currently on", () => {
    renderHeader("/portfolio");

    const nav = within(primaryNav());
    const portfolio = nav.getByRole("link", { name: "Portfolio" });

    expect(portfolio).toHaveAttribute("data-active", "true");
    expect(portfolio).toHaveAttribute("aria-current", "page");

    for (const label of ["Team", "Insights"]) {
      const other = nav.getByRole("link", { name: label });
      expect(other).not.toHaveAttribute("data-active");
      expect(other).not.toHaveAttribute("aria-current");
    }
  });

  it("keeps the parent index marked on a detail route", () => {
    renderHeader("/portfolio/empley");

    const nav = within(primaryNav());
    expect(nav.getByRole("link", { name: "Portfolio" })).toHaveAttribute("data-active", "true");
    expect(nav.getByRole("link", { name: "Portfolio" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Team" })).not.toHaveAttribute("aria-current");
  });

  it("does not mark a route whose href is only a string prefix of the current path", () => {
    // "/team" must not light up on "/teamwork"; the boundary is a path segment.
    renderHeader("/teamwork");

    expect(within(primaryNav()).getByRole("link", { name: "Team" })).not.toHaveAttribute(
      "data-active",
    );
  });

  it("marks nothing in the primary nav on the home route", () => {
    renderHeader("/");

    const links = within(primaryNav()).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).not.toHaveAttribute("aria-current");
  });

  it("renders the pitch CTA outside the primary list and marks it on its own route", () => {
    renderHeader("/pitch");

    // Pitch is an action, not a nav item: it must not be duplicated in the list.
    expect(within(primaryNav()).queryByRole("link", { name: "Pitch" })).toBeNull();

    const cta = screen.getByRole("link", { name: "Pitch" });
    expect(cta).toHaveAttribute("href", "/pitch");
    expect(cta).toHaveAttribute("data-active", "true");
  });

  it("floats over the dark hero on the home route and sits solid elsewhere", () => {
    const { unmount } = renderHeader("/");
    expect(screen.getByRole("banner")).toHaveAttribute("data-transparent", "true");
    expect(screen.getByRole("banner")).toHaveAttribute("data-surface", "dark");
    unmount();

    renderHeader("/team");
    expect(screen.getByRole("banner")).toHaveAttribute("data-transparent", "false");
    expect(screen.getByRole("banner")).toHaveAttribute("data-surface", "light");
  });

  it("names the logo link without recreating the wordmark as text", () => {
    renderHeader("/portfolio");

    const logoLink = screen.getByRole("link", { name: "Foundry Ventures — home" });
    expect(logoLink).toHaveAttribute("href", "/");
    // The delivered SVG masters are passed in as nodes; the header renders no
    // text wordmark of its own.
    expect(logoLink.textContent).toBe("");
  });

  it("marks the external LinkedIn action as opening in a new tab", () => {
    renderHeader("/portfolio");

    const link = screen.getByRole("link", { name: /LinkedIn/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName(expect.stringContaining("opens in a new tab"));
  });
});
