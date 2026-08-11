/**
 * §26.2 — the mobile navigation dialog (§6.1, §18.2).
 *
 * Driven through `HeaderShell` rather than through the dialog in isolation,
 * because half of the contract is about the relationship between the two: the
 * trigger owns `aria-expanded`/`aria-controls`, and focus has to come back to
 * it when the dialog closes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeaderShell } from "@/components/global/HeaderShell";
import type { NavItem } from "@/content/types";

const pathname = vi.hoisted(() => ({ current: "/portfolio" }));

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
  { label: "Pitch", href: "/pitch" },
];

/**
 * The logo slots take arbitrary nodes. Empty, unlabelled elements stand in for
 * the delivered SVG masters: nothing here may recreate the logotype, and the
 * link's accessible name comes from its `aria-label` anyway.
 */
function renderHeader() {
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

/**
 * Scoped to the header: once the dialog is open its own "Close menu" button
 * shares the accessible name with the trigger, which is exactly what the
 * trigger's label is supposed to become.
 */
const trigger = () => within(screen.getByRole("banner")).getByRole("button", { name: /menu/i });
const dialog = () => screen.getByRole("dialog");

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  // The dialog mounts in its "opening" state and moves focus one frame later.
  await waitFor(() => expect(dialog()).toHaveAttribute("data-state", "open"));
}

beforeEach(() => {
  pathname.current = "/portfolio";
  // jsdom has no layout, so the scroll position has to be declared explicitly
  // for the lock/restore assertions to mean anything.
  Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 120 });
});

afterEach(() => {
  delete document.body.dataset.scrollLocked;
  document.body.style.top = "";
});

describe("mobile navigation dialog", () => {
  it("is absent until the trigger is used, and the trigger reports its state", () => {
    renderHeader();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    // A real button with aria-controls, not a div with a click handler.
    expect(trigger().tagName).toBe("BUTTON");
    expect(trigger()).toHaveAttribute("aria-controls");
  });

  it("opens as a modal dialog and moves focus inside it", async () => {
    const user = userEvent.setup();
    renderHeader();

    await openMenu(user);

    const panel = dialog();
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAccessibleName("Site navigation");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", panel.id);

    await waitFor(() => expect(panel).toContainElement(document.activeElement as HTMLElement));
    expect(document.activeElement).toBe(within(panel).getByRole("link", { name: "Portfolio" }));
  });

  it("traps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    renderHeader();
    await openMenu(user);

    const panel = dialog();
    const first = within(panel).getByRole("link", { name: "Portfolio" });
    const last = within(panel).getByRole("button", { name: "Close menu" });

    await waitFor(() => expect(document.activeElement).toBe(first));

    // Backwards from the first focusable wraps to the last…
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);

    // …and forwards from the last wraps back to the first.
    await user.tab();
    expect(document.activeElement).toBe(first);

    // Focus never escapes into the header behind the dialog.
    expect(panel).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderHeader();
    await openMenu(user);

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it("closes from its own close button and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderHeader();
    await openMenu(user);

    await user.click(within(dialog()).getByRole("button", { name: "Close menu" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it("locks body scroll while open and restores the exact position on close", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, "scrollTo");
    renderHeader();

    await openMenu(user);

    expect(document.body.dataset.scrollLocked).toBe("true");
    expect(document.body.style.top).toBe("-120px");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // The unlock happens in an effect cleanup, one tick after the dialog leaves
    // the tree, so it is waited for rather than asserted on the same frame.
    await waitFor(() => expect(document.body.dataset.scrollLocked).toBeUndefined());
    expect(document.body.style.top).toBe("");
    expect(scrollTo).toHaveBeenLastCalledWith(0, 120);
  });

  it("marks the current route inside the dialog", async () => {
    const user = userEvent.setup();
    renderHeader();
    await openMenu(user);

    const panel = dialog();
    expect(within(panel).getByRole("link", { name: "Portfolio" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(panel).getByRole("link", { name: "Team" })).not.toHaveAttribute("aria-current");
  });

  it("marks its external link as opening in a new tab", async () => {
    const user = userEvent.setup();
    renderHeader();
    await openMenu(user);

    const link = within(dialog()).getByRole("link", { name: /LinkedIn/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName(expect.stringContaining("opens in a new tab"));
  });
});
