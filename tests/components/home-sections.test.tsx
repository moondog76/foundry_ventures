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
import { FeaturedPortfolio } from "@/components/home/FeaturedPortfolio";
import { InvestmentCriteriaGrid } from "@/components/home/InvestmentCriteriaGrid";
import { OfferingGrid } from "@/components/home/OfferingGrid";
import { VisionSection } from "@/components/home/VisionSection";
import { PREVIEW_POLICY, PRODUCTION_POLICY } from "@/content/policy";
import type {
  CompanySummary,
  EditorialText,
  FieldEvidence,
  HomePage,
  ImageAsset,
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

const COMPANY: CompanySummary = {
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
  descriptor: null,
  stages: [],
  sectors: [],
  focuses: [],
  status: null,
  founders: [],
  featured: true,
  sortOrder: 10,
};

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

  // The section ends on the tiles when no label is supplied. Guarded because the
  // obvious "fix" for a missing label is a hardcoded fallback, which would put
  // the link back without anyone noticing.
  it("omits the archive link entirely when no label is supplied", () => {
    render(
      <FeaturedPortfolio
        companies={[COMPANY]}
        policy={PRODUCTION_POLICY}
        heading="Portfolio"
        intro={null}
        ctaHref="/portfolio"
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Testcorp Fixture" })).toBeInTheDocument();
    expect(screen.queryAllByRole("link", { name: /portfolio/i })).toHaveLength(0);
  });
});
describe("InvestmentCriteriaGrid", () => {
  it("renders nothing when no criterion is owner-approved", () => {
    const { container } = render(
      <InvestmentCriteriaGrid criteria={[]} />,
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
      />,
    );

    expect(screen.getByText("Stage")).toBeInTheDocument();
    expect(screen.getByText("Pre-seed")).toBeInTheDocument();
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

describe("ContactCta", () => {
  const contact: HomePage["contact"] = {
    heading: unapproved("A closing heading awaiting approval"),
    paragraphs: [unapproved("A closing paragraph awaiting approval")],
    primaryCta: {
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
      />,
    );

    // The fallback comes from SiteSettings navigation, never invented here.
    expect(screen.getByRole("heading", { name: "Let's talk" })).toBeInTheDocument();
  });
});
