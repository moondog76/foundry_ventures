/**
 * `/about` page template (§13).
 *
 * Structure, in DOM order at every breakpoint:
 *
 *   h1 + intro → What we believe → How we work → What we look for → Process
 *
 * Two content decisions worth stating explicitly:
 *
 *  - the four section titles are the structural labels §13 names. They identify
 *    a region of the page rather than making a claim, which is why they are
 *    constants — the same rule the archive `h1`s follow. Writing a headline
 *    *about* what Foundry believes would be inventing brand voice (§25.1);
 *  - everything else is editorial copy from the content layer, and every string
 *    passes `canRenderEditorialText` (via `./text`) before it renders. In
 *    production the seed's unapproved copy resolves to null and the section
 *    disappears instead of rendering a stub.
 *
 * The `h1` prefers the authored heading and falls back to the route's own
 * navigation label — never to invented copy, and never to nothing: a page must
 * always carry exactly one `h1`.
 *
 * "What we believe" uses a desktop-only sticky heading column. It is pure CSS,
 * never required to understand the content, and it adds no page length: the
 * heading pins beside its own statements and releases at the end of the section.
 */

import type { PolicyContext } from "@/content/policy";
import type { AboutPage } from "@/content/types";
import { Container, Section } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { AboutStatements } from "./AboutStatements";
import { AboutSteps, type AboutStep } from "./AboutSteps";
import { ABOUT_TITLE, renderableStatements, renderableText, renderableTexts } from "./text";
import styles from "./about.module.css";

export type AboutViewProps = {
  about: AboutPage;
  policy: PolicyContext;
};

/** §13 section labels. Region names, not claims — see the file comment. */
const BELIEFS_TITLE = "What we believe";
const HOW_WE_WORK_TITLE = "How we work";
const WHAT_WE_LOOK_FOR_TITLE = "What we look for";
const PROCESS_TITLE = "Process";

export function AboutView({ about, policy }: AboutViewProps) {
  const heading = renderableText(about.heading, policy) ?? ABOUT_TITLE;
  const intro = renderableTexts(about.intro, policy);

  const beliefs = renderableStatements(about.beliefs, policy);
  const whatWeLookFor = renderableStatements(about.whatWeLookFor, policy);

  const howWeWork: AboutStep[] = about.howWeWork
    .map((item) => ({
      number: item.number,
      title: null,
      body: renderableText(item.body, policy),
    }))
    .filter((item) => item.body !== null);

  const process: AboutStep[] = about.process
    .map((item) => ({
      number: item.step,
      title: renderableText(item.title, policy),
      body: renderableText(item.body, policy),
    }))
    .filter((item) => item.title !== null || item.body !== null);

  return (
    <>
      <Section
        surface="dark"
        spacing="tight"
        className={styles.hero}
        aria-labelledby="about-heading"
      >
        <Container>
          <Reveal className={styles.heroInner}>
            <h1 id="about-heading" className={styles.heroHeading}>
              {heading}
            </h1>
            {intro.map((paragraph) => (
              <p key={paragraph} className={styles.heroIntro}>
                {paragraph}
              </p>
            ))}
          </Reveal>
        </Container>
      </Section>

      <AboutStatements
        title={BELIEFS_TITLE}
        headingId="about-beliefs"
        statements={beliefs}
        sticky
        surface="light"
      />

      <AboutSteps
        title={HOW_WE_WORK_TITLE}
        headingId="about-how-we-work"
        steps={howWeWork}
        surface="off-white"
      />

      <AboutStatements
        title={WHAT_WE_LOOK_FOR_TITLE}
        headingId="about-what-we-look-for"
        statements={whatWeLookFor}
        surface="light"
      />

      <AboutSteps
        title={PROCESS_TITLE}
        headingId="about-process"
        steps={process}
        surface="off-white"
      />
    </>
  );
}
