/**
 * §26.2 — the pitch form (§11.2, §19.5, §20.5).
 *
 * Three failure-shaped guarantees are what this file protects:
 *  - a failed submit puts the user in front of a summary that links to the
 *    fields that need fixing;
 *  - a server-side failure never costs the founder a word of what they typed;
 *  - the honeypot is invisible to a human *and* to assistive technology, while
 *    still being a real input a bot will fill.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PitchForm } from "@/components/forms/PitchForm";
import { MIN_FORM_FILL_MS } from "@/lib/validation/pitch";

/**
 * The form holds a submission back until the founder has had `MIN_FORM_FILL_MS`
 * to read it. Rather than making every test wait three real seconds, the clock
 * the component reads is advanced by hand between mount and submit.
 */
let clock = 1_700_000_000_000;

function advancePastAntiSpamWindow() {
  clock += MIN_FORM_FILL_MS * 2;
}

/** Minimal stand-in for the parts of `Response` the form actually reads. */
function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const VALID = {
  firstName: "Fixture",
  lastName: "Founder",
  email: "founder@example.com",
  companyName: "Testcorp Fixture",
  oneLinePitch: "A synthetic one-line pitch used only by the tests.",
  description:
    "A synthetic description used only by the component tests. It is long enough to clear the hundred character minimum the schema enforces.",
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox", { name: /^Country/ }), "Sweden");
  await user.type(screen.getByRole("textbox", { name: /^First name/ }), VALID.firstName);
  await user.type(screen.getByRole("textbox", { name: /^Last name/ }), VALID.lastName);
  await user.type(screen.getByRole("textbox", { name: /^Email/ }), VALID.email);
  await user.type(screen.getByRole("textbox", { name: /^Company name/ }), VALID.companyName);
  await user.selectOptions(screen.getByRole("combobox", { name: /^Current stage/ }), "MVP");
  await user.type(screen.getByRole("spinbutton", { name: /^Funding raised/ }), "0");
  await user.type(screen.getByRole("textbox", { name: /^One-line pitch/ }), VALID.oneLinePitch);
  await user.type(
    screen.getByRole("textbox", { name: /^More about the company/ }),
    VALID.description,
  );
  await user.click(screen.getByRole("checkbox", { name: /privacy notice/ }));
}

const submitButton = () => screen.getByRole("button", { name: "Send pitch" });

beforeEach(() => {
  clock = 1_700_000_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => clock);
});
// `restoreMocks` and `unstubGlobals` in vitest.config.ts undo the spy and the
// stubbed `fetch` after every test.

describe("pitch form validation summary", () => {
  it("shows a summary that takes focus and links to every failing field", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);

    expect(screen.queryByRole("heading", { name: /problems with your pitch/i })).toBeNull();

    await user.click(submitButton());

    const heading = await screen.findByRole("heading", { name: /problems with your pitch/i });
    const summary = heading.parentElement as HTMLElement;

    // Focus is moved rather than announced through role="alert": doing both
    // makes most screen readers read the summary twice.
    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(summary).toHaveAttribute("tabindex", "-1");
    expect(summary).toHaveAccessibleName(heading.textContent as string);

    const links = within(summary).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href.startsWith("#pitch-")).toBe(true);
      // Every anchor must actually resolve to a control on the page.
      expect(document.getElementById(href.slice(1))).not.toBeNull();
    }
  });

  it("moves focus to the field when a summary entry is followed", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);
    await user.click(submitButton());

    const summary = (await screen.findByRole("heading", { name: /problems with your pitch/i }))
      .parentElement as HTMLElement;
    const emailLink = within(summary).getByRole("link", { name: /^Email:/ });

    await user.click(emailLink);

    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^Email/ }));
  });

  it("marks the failing control invalid and describes it by its own message", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);
    await user.click(submitButton());

    const email = await screen.findByRole("textbox", { name: /^Email/ });
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(expect.stringContaining("email"));
  });

  it("clears a field's error as soon as it is edited", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);
    await user.click(submitButton());

    const email = await screen.findByRole("textbox", { name: /^Email/ });
    expect(email).toHaveAttribute("aria-invalid", "true");

    await user.type(email, "f");

    expect(email).not.toHaveAttribute("aria-invalid");
  });

  it("does not submit anything to the network when validation fails", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);

    await user.click(submitButton());

    await screen.findByRole("heading", { name: /problems with your pitch/i });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("pitch form server failure", () => {
  it("keeps every entered value after a server error and explains what happened", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(500, {
        ok: false,
        kind: "server",
        message: "Something went wrong on our side. Nothing was lost — please try again.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);
    await fillValidForm(user);
    advancePastAntiSpamWindow();

    await user.click(submitButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await screen.findByText(/Nothing was lost/);

    // The form is still the form — no success screen, nothing reset.
    expect(screen.getByRole("textbox", { name: /^First name/ })).toHaveValue(VALID.firstName);
    expect(screen.getByRole("textbox", { name: /^Email/ })).toHaveValue(VALID.email);
    expect(screen.getByRole("textbox", { name: /^Company name/ })).toHaveValue(VALID.companyName);
    expect(screen.getByRole("textbox", { name: /^One-line pitch/ })).toHaveValue(
      VALID.oneLinePitch,
    );
    expect(screen.getByRole("textbox", { name: /^More about the company/ })).toHaveValue(
      VALID.description,
    );
    expect(screen.getByRole("combobox", { name: /^Country/ })).toHaveValue("Sweden");
    expect(screen.getByRole("checkbox", { name: /privacy notice/ })).toBeChecked();
  });

  it("posts JSON so nothing the founder typed ends up in a URL", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(500, { ok: false, kind: "server", message: "x" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);
    await fillValidForm(user);
    advancePastAntiSpamWindow();
    await user.click(submitButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/pitch");
    expect(init.method).toBe("POST");
    expect(String(url)).not.toContain(VALID.email);
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.email).toBe(VALID.email);
    expect(body.website2).toBe("");
  });

  it("renders per-field messages returned by the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(400, {
          ok: false,
          kind: "validation",
          errors: { email: "That address is already in our system." },
        }),
      ),
    );

    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);
    await fillValidForm(user);
    advancePastAntiSpamWindow();
    await user.click(submitButton());

    await screen.findByText("That address is already in our system.");
    expect(screen.getByRole("textbox", { name: /^Email/ })).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps the submit button focusable while a request is in flight", async () => {
    let release: () => void = () => undefined;
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        await inFlight;
        return jsonResponse(500, { ok: false, kind: "server", message: "x" });
      }),
    );

    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);
    await fillValidForm(user);
    advancePastAntiSpamWindow();
    await user.click(submitButton());

    await waitFor(() => expect(submitButton()).toHaveAttribute("aria-busy", "true"));

    // A native `disabled` would blur the button and throw a keyboard user back
    // to <body> at the exact moment they need feedback, so the guard is
    // `aria-disabled` plus an in-flight check inside the handler.
    expect(submitButton()).toHaveAttribute("aria-disabled", "true");
    expect(submitButton()).not.toBeDisabled();
    submitButton().focus();
    expect(document.activeElement).toBe(submitButton());

    // The pending status is announced politely rather than by moving focus.
    expect(screen.getByText("Sending your pitch…")).toBeInTheDocument();

    release();
    await waitFor(() => expect(submitButton()).not.toHaveAttribute("aria-busy"));
  });
});

describe("pitch form honeypot", () => {
  it("is a real input that is hidden from assistive technology", () => {
    const { container } = render(<PitchForm />);

    const honeypot = container.querySelector<HTMLInputElement>("#pitch-website2");
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("name", "website2");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");

    // Hidden from the accessibility tree, so no screen-reader user can be
    // tricked into filling it.
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole("textbox", { name: "Website" })).toBeNull();
  });

  it("is not counted among the fields a user has to complete", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);

    await user.click(submitButton());

    const summary = (await screen.findByRole("heading", { name: /problems with your pitch/i }))
      .parentElement as HTMLElement;
    expect(within(summary).queryByRole("link", { name: /website2/i })).toBeNull();
  });
});

describe("pitch form conditional fields", () => {
  it('reveals and announces the "other" question only when it applies', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PitchForm />);

    expect(screen.queryByRole("textbox", { name: /Country \(other\)/ })).toBeNull();

    await user.selectOptions(screen.getByRole("combobox", { name: /^Country/ }), "Other");

    const other = await screen.findByRole("textbox", { name: /Country \(other\)/ });
    expect(other).toBeInTheDocument();
    // The insertion is announced, because a field appearing out of nowhere is
    // otherwise silent.
    await waitFor(() =>
      expect(screen.getByText(/An extra question has been added/)).toBeInTheDocument(),
    );

    await user.selectOptions(screen.getByRole("combobox", { name: /^Country/ }), "Sweden");
    expect(screen.queryByRole("textbox", { name: /Country \(other\)/ })).toBeNull();
  });
});
