# Editor guide

For the person who owns Foundry's content. It covers how to add each kind of
record, how to change the firm's investment criteria and site settings, why an
unapproved field simply does not appear on the live site, and how to preview
work before it is approved.

You do not need to read any code to use this guide, but you do need someone with
repository access to make the change — see the next section for why.

---

## Where content lives right now

Content is stored as structured data files under `src/content/seed/`. A CMS
(Sanity) is wired up and ready, but it activates only when its credentials are
configured; until then the files are the source of truth
([decision D-003](./decisions.md#d-003)).

**In practice: today, a content change is a pull request.** You decide what the
content should be; an engineer applies it; the change is reviewed and deployed.
Once Sanity is connected the same fields appear in the Studio and you edit them
directly — every rule in this guide stays exactly the same, because the rules
live in the publishing policy, not in the storage.

| Content                                    | File                                |
| ------------------------------------------ | ----------------------------------- |
| Portfolio companies                        | `src/content/seed/companies.ts`     |
| Team members                               | `src/content/seed/team.ts`          |
| News & Insights posts                      | `src/content/seed/posts.ts`         |
| Testimonials                               | `src/content/seed/testimonials.ts`  |
| Network people                             | `src/content/seed/network.ts`       |
| Home page copy                             | `src/content/seed/home.ts`          |
| About page copy                            | `src/content/seed/about.ts`         |
| Site settings, navigation, criteria, stats | `src/content/seed/site-settings.ts` |
| Privacy notice                             | `src/content/seed/legal.ts`         |
| Images                                     | `src/content/seed/images.ts`        |

---

## The one rule behind everything: evidence and approval

Every fact on this site carries a record of where it came from and whether you
have approved it. There are three levels:

| Level            | Meaning                                             | Appears on the live site? |
| ---------------- | --------------------------------------------------- | ------------------------- |
| `unverified`     | No source at all. Someone would have to invent it.  | No                        |
| `observed`       | Seen on the old live site or in the audit material. | **No**                    |
| `owner-approved` | You looked at it and said yes, on a date, by name.  | Yes                       |

Every piece of _copy_ has a parallel switch: `unapproved` or `approved`.

**`observed` deliberately does not publish.** That surprises people, so it is
worth being blunt about why: "the old site said this" is evidence about the old
site. It is not a decision that the new site should say it too. Migrating a
sentence and approving a sentence are different acts, and the whole point of this
system is that the second one has to actually happen.

### Why an unapproved field just disappears

It does not render as blank, or as "TBC", or as a grey box. The element is not
there at all. A company with an approved name but an unapproved tagline renders
as a card with a name and no tagline — a slightly quieter card, not a broken one.
A person without an approved long biography does not get a profile page; they
stay as a section on the team page, and no link to a missing page is ever
created.

This is deliberate. The alternative — placeholder text on a live investor site —
is how "Lorem ipsum" and "example@example.com" end up in front of a founder.

**Approval is per field.** You can approve a company's name today and leave its
founders unverified for months. The card gets steadily richer as facts are
confirmed; nothing waits for everything.

### What "approved" costs you

An approval records **who** approved it and **when**, plus the sources behind the
claim. There is no anonymous approval and no default date. In six months, when
someone asks "why does the site say Foundry's sweet spot is €200k?", the answer
is a name, a date and a source — or the claim is not on the site.

`docs/content-gaps.md` lists everything currently waiting for you, with the exact
syntax for approving a field at the bottom.

---

## Adding a portfolio company

**File:** `src/content/seed/companies.ts`

### What you need

| Field                                                    | Required for                                 | Notes                                                                                                                         |
| -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `name`                                                   | Appearing at all                             | Exact casing. Confirm with the company.                                                                                       |
| `websiteUrl`                                             | The card's link when there is no detail page | Must resolve to the right company.                                                                                            |
| `logo`                                                   | The logo on the card                         | A rights-cleared file. Without it the card shows the company name typographically — which is a designed state, not a failure. |
| `caption` / `shortDescription`                           | The line under the name                      | **May be empty.** Two current companies have no caption and none may be invented for them.                                    |
| `body`                                                   | A `/portfolio/[slug]` page                   | A real description. No body, no page.                                                                                         |
| `stages`, `sectors`, `focuses`, `status`                 | Filters                                      | See below.                                                                                                                    |
| `founders`, `headquarters`, `investmentYear`, `dealLead` | The detail page's metadata                   | All optional; each hides individually.                                                                                        |

### What makes it appear

1. **On `/portfolio`:** `publicationStatus: "published"` **and** an approved
   `name`. That is the whole requirement — a name-only company is a valid,
   publishable card.
2. **With its own page at `/portfolio/[slug]`:** additionally an approved `logo`
   and `websiteUrl`, **and** an approved, non-empty `shortDescription` and
   `body`. Anything less and no page is generated.
3. **Where the card links:** its own page if it has one; otherwise straight out
   to the company's website (marked as an external link); otherwise the card is
   not a link at all. You never choose this — it follows from what is approved.

A company whose `status` is `inactive` never appears publicly. That state is for
your internal records.

### About filters

Filter groups are built from the taxonomy you approve, and **a group with fewer
than two distinct values does not render**. If only one company is tagged
"Fintech", there is no sector filter. This means filters appear on their own once
enough companies are tagged, and you never have to maintain the filter UI — but
it also means tagging one company achieves nothing visible. Tag in batches.

Filter values are used verbatim in the URL, so they are lowercase and
hyphenated: `ai-infrastructure`, not `AI Infrastructure`.

---

## Adding a team member

**File:** `src/content/seed/team.ts`

### What makes them appear

1. **On `/team`:** `active: true`, `publicationStatus: "published"`, and an
   approved `name` **and** `role`.
2. **With a profile page at `/team/[slug]`:** additionally an approved,
   non-empty long biography. This is a firm rule — a profile page that says only
   "Partner" is worse than no page, so it is not created. The person is still
   fully present on `/team`, and links point at `/team#their-slug`.

### Contact details

Email, phone and LinkedIn are each approved separately, and each is the person's
own decision. An approved email becomes a `mailto:` link; an approved phone
number becomes a tap-to-call link on mobile. If someone would rather not publish
a number, leave it unverified — the contact block renders without it and nothing
looks incomplete.

### Relations you do not enter here

Do **not** list which companies someone led or which articles they wrote. Those
are recorded once, on the company (`dealLead`) and on the post (`authors`), and
the profile page derives them. Entering them twice is how the two copies start
disagreeing.

---

## Adding a post (News & Insights)

**File:** `src/content/seed/posts.ts` — currently empty, and the `insights`
feature flag is off until it is not.

There are two kinds of post, and the difference matters:

**Internal** — the article lives on this site. Needs a `slug` and a `body`.

**External** — the story lives somewhere else (a portfolio company's own
announcement, a press piece). Needs an `externalUrl`. It appears in the archive
and links straight out. **No internal page is created for it**, on purpose: a
stub page that just repeats a headline and links elsewhere is a thin duplicate
that competes with the real article in search results.

### What makes a post appear

`publicationStatus: "published"`, editorial approval, a `publishedAt` date, and
the content its kind requires (slug + body, or external URL). Plus the `insights`
feature flag being on.

### Relations

`authors` are team members, `companies` are portfolio companies. Both drive
things automatically: a post tagged with a company shows up on that company's
page, and a post tagged with an author shows up on that author's profile.

`relatedPosts` is optional. Related content is chosen by: your manual list first,
then posts sharing a company, then posts sharing an author — newest first, up to
three, never repeating a post and never including the current one. If there are
no candidates the whole section is hidden rather than rendering an empty heading.

---

## Adding a testimonial

**File:** `src/content/seed/testimonials.ts` — currently empty, flag off.

A testimonial needs two independent things:

1. **The quote and the person's name**, both approved.
2. **Recorded consent** — `consentStatus: "granted"`.

Consent is tracked as its own field for a reason. Setting it to `"revoked"`
removes the testimonial **everywhere immediately, including in preview**. It is
the one piece of content that vanishes even from the editors' own view, because
a withdrawn consent is not a publishing decision to be reviewed later.

`missing` and `requested` are also valid states, so you can enter a quote you are
in the middle of clearing without any risk of it appearing.

---

## Updating the investment criteria

**File:** `src/content/seed/site-settings.ts`, the `investmentCriteria` array.

Each row is a label, a value, a sort order and its own evidence. Rows render in
`sortOrder`, and **only rows whose evidence is approved render at all** — so the
grid can show four rows while two more sit unapproved beneath them.

Two things to know before you edit this:

- The ticket range (€50k–€300k) and sweet spot (€200k) currently in the file come
  **only from a design prototype**. They were never on the live site and nobody
  at Foundry has confirmed them. They are marked unverified precisely so they
  cannot leak onto the site by accident. Confirm the real numbers before
  approving.
- "Industry: Agnostic" and "Technology focus" are two separate rows on purpose.
  Collapsing them into something like "Sector: Generalist" loses a distinction
  Foundry actually makes.

The whole section is also behind the `investmentCriteria` feature flag, so
approving the rows and showing the section are two separate steps.

---

## Updating site settings

**File:** `src/content/seed/site-settings.ts`

| What                                         | Field                                               | Notes                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand name shown in the wordmark area        | `displayBrandName`                                  | Currently "Foundry ventures" (lowercase v), matching the live site.                                                                                      |
| Brand name in page titles and search results | `seoBrandName`                                      | Currently "Foundry Ventures".                                                                                                                            |
| Registered company name                      | `legalName`                                         | Not yet known.                                                                                                                                           |
| Navigation                                   | `navigation`, `footerNavigation`, `legalNavigation` | Items tied to a feature flag disappear automatically when the flag is off — you never have to remove them by hand.                                       |
| Contact people                               | `contactPeople`                                     | References to team members. The footer and the home contact block read their details from the team record, so an address is only ever written down once. |
| Social links                                 | `socialLinks`                                       | The LinkedIn URL appears here **and** as `linkedinUrl`; keep them identical.                                                                             |
| Statistics                                   | `stats`                                             | See below.                                                                                                                                               |
| Feature flags                                | `featureFlags`                                      | See below.                                                                                                                                               |

### Statistics

A stat can have a `derivedKey`, and when it does its number is **recomputed from
the live content** every time the page is built. The "Portfolio companies" stat
counts the companies that actually publish. You cannot type a number that
disagrees with the list it describes, which is the entire point.

### Feature flags

Six sections of the site are switched off: investment criteria, insights, about,
network, stats and testimonials. A flag that is off means the route returns "not
found", the navigation item is gone, and the sitemap does not mention it. Nothing
leaks: an unpublished post cannot appear as related content on another page
either.

**Turn a flag on only when the content behind it is approved and real.** The flag
reveals a section; it does not create anything to put in it. Turning on
`insights` with no posts produces an empty archive page, which advertises a
capability Foundry is not currently demonstrating.

---

## Previewing unapproved work

Preview mode renders **everything** — unapproved fields, unpublished records,
draft pages — behind a visible banner, with search engines blocked.

### Getting in

Open this URL, replacing the secret with the one your engineer gives you:

```
https://www.foundryventures.ai/api/draft/enable?secret=YOUR_SECRET&redirect=/portfolio
```

`redirect` is where you land. It must be a path on this site (`/portfolio`,
`/team`, `/`) — anything else is rejected rather than silently redirected
somewhere unexpected.

If the endpoint returns "not found", the preview secret is not configured on that
deployment. That is a deliberate posture: a site without the secret has no
preview surface at all rather than one waiting to be guessed at.

### While you are in preview

- A banner appears on every page, so you always know which view you are looking
  at. It is not subtle on purpose.
- Everything unapproved is visible — this is how you review the whole site as it
  _would_ look once approved.
- Nothing is indexable, and preview deployments tell search engines to stay out
  entirely.
- **What you see is not what the public sees.** Before signing anything off,
  check the same page outside preview to see what actually publishes today.

### Getting out

Click "Exit preview" in the banner, or open `/api/draft/disable`. This always
works, needs no secret, and cannot be blocked by a bad link — leaving preview is
never allowed to fail.

### Locally

A developer running the site on their own machine is in preview mode by default,
so they see the full site while working. That is why "it looks fine locally" and
"the live site is empty" can both be true at the same time.

---

## Questions worth asking before you approve anything

- **Is this a fact about Foundry, or a fact about the old website?** Migrating a
  sentence and endorsing a sentence are different decisions.
- **Whose fact is it?** A founder's name, a portfolio company's tagline and a
  colleague's phone number are not Foundry's to publish alone.
- **Where did this number come from?** If the answer is "it was in the design
  mock-up", it is not a source.
- **What happens if this is wrong?** A wrong company website sends a visitor to
  the wrong business. A wrong LinkedIn URL in structured data is durable and gets
  copied elsewhere.
- **Is "we don't publish that" an acceptable answer?** Almost always, yes. The
  design handles absent fields; it does not handle invented ones.
