/**
 * §26.2 — the optional home sections (§7, §25.1).
 *
 * Every one of these sections is content-dependent, and the frozen dataset
 * publishes almost none of it. The contract is the same everywhere: nothing to
 * show means nothing rendered — no frame, no heading, no "coming soon". These
 * tests pin that down for each section, and pair it with a positive case so the
 * null assertions cannot pass for the wrong reason.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactCta } from "@/components/home/ContactCta";
import { EditorialImagePair } from "@/components/home/EditorialImagePair";
import { FeaturedPortfolio } from "@/components/home/FeaturedPortfolio";
import { InvestmentCriteriaGrid } from "@/components/home/InvestmentCriteriaGrid";
import { LatestInsights } from "@/components/home/LatestInsights";
import { OfferingGrid } from "@/components/home/OfferingGrid";
import { StatsGrid } from "@/components/home/StatsGrid";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { VisionSection } from "@/components/home/VisionSection";
import { PREVIEW_POLICY, PRODUCTION_POLICY } from "@/content/policy";
import type {
  CompanySummary,
  EditorialText,
  FieldEvidence,
  HomePage,
  ImageAsset,
  Testimonial,
} from "@/content/types";

const unapproved = (value: string): EditorialText => ({
  value,
  origin: "proposed",
  approvalStatus: "unapproved",
});

const approved = (value: string): EditorialText => ({
  value,
  origin: "proposed",
  approvalStatus: "approved",
});

const APPROVED_EVIDENCE: FieldEvidence = {
  status: "owner-approved",
  sources: [{ label: "Component-test fixture", observedAt: "2026-08-10" }],
};

/** An export reference: recorded, but the binary is not in the workspace. */
const UNAVAILABLE_IMAGE: ImageAsset = {
  id: "unavailable",
  src: "https://cdn.example.com/art.jpg",
  width: 1600,
  height: 1200,
  rightsStatus: "approved",
  available: false,
};

const AVAILABLE_IMAGE: ImageAsset = {
  id: "available",
  src: "/fixtures/art.jpg",
  width: 1600,
  height: 1200,
  rightsStatus: "approved",
  available: true,
};

const COMPANY: CompanySummary = {
  id: "c1",
  slug: "testcorp-fixture",
  name: "Testcorp Fixture",
  href: "/portfolio/testcorp-fixture",
  externalHref: null,
  logo: null,
  logoAlt: "Testcorp Fixture logo",
  logoFit: "contain",
  opticalScale: 1,
  cardImage: null,
  tagline: null,
  stages: [],
  sectors: [],
  focuses: [],
  status: null,
  founders: [],
  featured: true,
  sortOrder: 10,
};

describe("StatsGrid", () => {
  it("renders nothing when no stat cleared the policy", () => {
    const { container } = render(<StatsGrid stats={[]} heading="Foundry in numbers" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the figures it was given", () => {
    render(
      <StatsGrid
        stats={[
          {
            value: 8,
            label: "Portfolio companies",
            evidence: APPROVED_EVIDENCE,
            sortOrder: 10,
          },
        ]}
        heading="Foundry in numbers"
      />,
    );

    expect(screen.getByRole("heading", { name: "Foundry in numbers" })).toBeInTheDocument();
    expect(screen.getByText("Portfolio companies")).toBeInTheDocument();
  });
});

describe("FeaturedPortfolio", () => {
  it("renders nothing when no company is publishable", () => {
    const { container } = render(
      <FeaturedPortfolio
        companies={[]}
        policy={PRODUCTION_POLICY}
        heading="Portfolio"
        intro={null}
        ctaLabel="See the portfolio"
        ctaHref="/portfolio"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one card per company, with the archive CTA", () => {
    render(
      <FeaturedPortfolio
        companies={[COMPANY]}
        policy={PRODUCTION_POLICY}
        heading="Portfolio"
        intro={null}
        ctaLabel="See the portfolio"
        ctaHref="/portfolio"
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Testcorp Fixture" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See the portfolio" })).toHaveAttribute(
      "href",
      "/portfolio",
    );
  });
});

describe("LatestInsights", () => {
  it("renders nothing when there are no publishable posts", () => {
    const { container } = render(
      <LatestInsights
        posts={[]}
        policy={PRODUCTION_POLICY}
        heading="News & Insights"
        ctaLabel="See all insights"
        ctaHref="/insights"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("links an external post straight out", () => {
    render(
      <LatestInsights
        posts={[
          {
            id: "p1",
            title: "A fixture news item",
            type: "portfolio-news",
            href: "https://example.org/news",
            isExternal: true,
            excerpt: "Fixture excerpt.",
            publishedAt: "2026-06-01",
            heroImage: null,
            authors: [],
            companies: [],
            readingTimeMinutes: null,
          },
        ]}
        policy={PRODUCTION_POLICY}
        heading="News & Insights"
        ctaLabel={null}
        ctaHref="/insights"
      />,
    );

    const link = screen.getByRole("link", { name: /A fixture news item/ });
    expect(link).toHaveAttribute("href", "https://example.org/news");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAccessibleName(expect.stringContaining("opens in a new tab"));
  });
});

describe("TestimonialsCarousel", () => {
  const testimonial = (id: string): Testimonial => ({
    id,
    publicationStatus: "published",
    consentStatus: "granted",
    quote: `A fixture testimonial quote (${id}).`,
    personName: "Fixture Founder",
    featured: false,
    sortOrder: 10,
    fieldEvidence: { quote: APPROVED_EVIDENCE, personName: APPROVED_EVIDENCE },
  });

  it("renders nothing when there is nothing to quote", () => {
    const { container } = render(
      <TestimonialsCarousel testimonials={[]} policy={PRODUCTION_POLICY} heading="From founders" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single quote with no carousel controls at all", () => {
    render(
      <TestimonialsCarousel
        testimonials={[testimonial("t1")]}
        policy={PRODUCTION_POLICY}
        heading="From founders"
      />,
    );

    expect(screen.getByText("A fixture testimonial quote (t1).")).toBeInTheDocument();
    // A carousel of one would be a lie about how much content exists.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders controls only once there is more than one quote", () => {
    render(
      <TestimonialsCarousel
        testimonials={[testimonial("t1"), testimonial("t2")]}
        policy={PRODUCTION_POLICY}
        heading="From founders"
      />,
    );

    expect(screen.getByRole("button", { name: "Previous testimonial" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next testimonial" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "From founders" })).toBeInTheDocument();
  });
});

describe("InvestmentCriteriaGrid", () => {
  it("renders nothing when no criterion is owner-approved", () => {
    const { container } = render(
      <InvestmentCriteriaGrid criteria={[]} ctaHref="/pitch" ctaLabel="Pitch us" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders approved criteria as a description list", () => {
    render(
      <InvestmentCriteriaGrid
        criteria={[
          { label: "Stage", value: "Pre-seed", evidence: APPROVED_EVIDENCE, sortOrder: 10 },
          { label: "Geography", value: "Nordics", evidence: APPROVED_EVIDENCE, sortOrder: 20 },
        ]}
        ctaHref="/pitch"
        ctaLabel="Pitch us"
      />,
    );

    expect(screen.getByText("Stage")).toBeInTheDocument();
    expect(screen.getByText("Pre-seed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pitch us" })).toHaveAttribute("href", "/pitch");
  });
});

describe("VisionSection", () => {
  const vision: HomePage["vision"] = {
    eyebrow: unapproved("Vision"),
    heading: unapproved("A heading awaiting approval"),
    paragraphs: [unapproved("A paragraph awaiting approval")],
  };

  it("renders nothing in production while the copy is unapproved", () => {
    const { container } = render(<VisionSection vision={vision} policy={PRODUCTION_POLICY} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the same copy in preview, where an editor is reviewing it", () => {
    render(<VisionSection vision={vision} policy={PREVIEW_POLICY} />);
    expect(
      screen.getByRole("heading", { name: "A heading awaiting approval" }),
    ).toBeInTheDocument();
  });

  it("renders approved copy in production", () => {
    render(
      <VisionSection
        vision={{
          eyebrow: approved("Vision"),
          heading: approved("An approved heading"),
          paragraphs: [approved("An approved paragraph")],
        }}
        policy={PRODUCTION_POLICY}
      />,
    );

    expect(screen.getByRole("heading", { name: "An approved heading" })).toBeInTheDocument();
    expect(screen.getByText("An approved paragraph")).toBeInTheDocument();
  });
});

describe("OfferingGrid", () => {
  it("renders nothing when neither the copy nor the artwork is publishable", () => {
    const { container } = render(
      <OfferingGrid
        offering={{
          eyebrow: unapproved("Offering"),
          items: [{ number: "01", body: unapproved("An item awaiting approval") }],
          images: [UNAVAILABLE_IMAGE],
        }}
        policy={PRODUCTION_POLICY}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the published #offering anchor once anything is publishable", () => {
    const { container } = render(
      <OfferingGrid
        offering={{
          eyebrow: approved("Offering"),
          items: [{ number: "01", body: approved("An approved item") }],
          images: [],
        }}
        policy={PRODUCTION_POLICY}
      />,
    );

    // `/offering` 308-redirects to `/#offering`, so this id is a contract.
    expect(container.querySelector("#offering")).not.toBeNull();
    expect(screen.getByText("An approved item")).toBeInTheDocument();
  });
});

describe("EditorialImagePair", () => {
  it("renders nothing when no rights-cleared binary exists", () => {
    const { container } = render(
      <EditorialImagePair images={[UNAVAILABLE_IMAGE]} policy={PRODUCTION_POLICY} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the artwork it is allowed to render", () => {
    const { container } = render(
      <EditorialImagePair images={[AVAILABLE_IMAGE]} policy={PRODUCTION_POLICY} />,
    );
    expect(container.querySelector("img")).not.toBeNull();
  });
});

describe("ContactCta", () => {
  const contact: HomePage["contact"] = {
    heading: unapproved("A closing heading awaiting approval"),
    paragraphs: [unapproved("A closing paragraph awaiting approval")],
    primaryCta: { label: unapproved("Pitch us"), href: "/pitch" },
    secondaryCta: {
      label: unapproved("Email us"),
      contactPerson: { id: "m1", slug: "fixture-person", name: "Fixture Person" },
    },
    contactPeople: [{ id: "m1", slug: "fixture-person", name: "Fixture Person" }],
  };

  it("renders nothing when neither the copy nor a contact person is publishable", () => {
    const { container } = render(
      <ContactCta
        contact={contact}
        people={[]}
        policy={PRODUCTION_POLICY}
        image={UNAVAILABLE_IMAGE}
        primaryCtaFallbackLabel="Pitch"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to the navigation label when the authored CTA label is unapproved", () => {
    render(
      <ContactCta
        contact={{ ...contact, heading: approved("Let's talk") }}
        people={[]}
        policy={PRODUCTION_POLICY}
        image={UNAVAILABLE_IMAGE}
        primaryCtaFallbackLabel="Pitch"
      />,
    );

    // The fallback comes from SiteSettings navigation, never invented here.
    expect(screen.getByRole("link", { name: "Pitch" })).toHaveAttribute("href", "/pitch");
    expect(screen.getByRole("heading", { name: "Let's talk" })).toBeInTheDocument();
  });
});
