"use client";

/**
 * Testimonials (§7.7).
 *
 * Rules this component implements literally:
 *   - nothing to show → nothing rendered;
 *   - exactly one testimonial → a static block with no controls at all, because
 *     a carousel of one is a lie about the amount of content;
 *   - manual only. There is no autoplay, no timer and no `setInterval` anywhere
 *     in this file;
 *   - arrow keys move the carousel while the region has focus;
 *   - indicators are real buttons with 44×44 targets;
 *   - "Slide X of Y" is announced politely, only after the reader has actually
 *     moved — an announcement on page load is noise;
 *   - dragging is horizontal-only: a gesture that starts vertical is handed
 *     straight back to the page, and `touch-action: pan-y` keeps native scroll.
 *
 * It is a client component, so it receives raw records plus the policy context
 * (a plain `{ mode }` object) and applies the same evidence gates the server
 * would — never its own rules.
 */

import { useCallback, useId, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Testimonial } from "@/content/types";
import { canRenderEvidence, canRenderImage, type PolicyContext } from "@/content/policy";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/global/icons";
import { Container, Section, cx } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import styles from "./testimonials-carousel.module.css";

export type TestimonialsCarouselProps = {
  testimonials: Testimonial[];
  policy: PolicyContext;
  /** Approved section heading, or null while still unapproved. */
  heading: string | null;
};

/** Distance, in CSS pixels, a drag must cover before it changes slide. */
const SWIPE_THRESHOLD = 48;
/** Distance before a gesture is committed to one axis. */
const AXIS_LOCK = 10;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  axis: "undecided" | "horizontal";
};

function TestimonialCard({
  testimonial,
  policy,
}: {
  testimonial: Testimonial;
  policy: PolicyContext;
}) {
  const title = canRenderEvidence(testimonial.fieldEvidence.personTitle, policy)
    ? testimonial.personTitle
    : undefined;
  const company = canRenderEvidence(testimonial.fieldEvidence.company, policy)
    ? testimonial.company
    : undefined;
  const showImage =
    canRenderEvidence(testimonial.fieldEvidence.image, policy) &&
    canRenderImage(testimonial.image, policy);

  return (
    <figure className={styles.card}>
      {showImage ? (
        <ResponsiveImage
          image={testimonial.image}
          policy={policy}
          alt=""
          sizes="(min-width: 992px) 200px, 120px"
          frameClassName={styles.portrait}
        />
      ) : null}
      <blockquote className={styles.quote}>
        <p>{testimonial.quote}</p>
      </blockquote>
      <figcaption className={styles.attribution}>
        <span className={styles.person}>{testimonial.personName}</span>
        {title ? <span className={styles.role}>{title}</span> : null}
        {company ? <span className={styles.company}>{company.name}</span> : null}
      </figcaption>
    </figure>
  );
}

export function TestimonialsCarousel({ testimonials, policy, heading }: TestimonialsCarouselProps) {
  const headingId = useId();
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [moved, setMoved] = useState(false);
  const drag = useRef<DragState | null>(null);

  const count = testimonials.length;
  // Derived rather than stored: a list that shrinks between renders (a revoked
  // consent, a narrower policy) can never strand the carousel on a slide that
  // no longer exists, and no effect is needed to repair it.
  const activeIndex = count > 0 ? Math.min(index, count - 1) : 0;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      // Wrapping keeps focus on the control the reader just pressed; disabling a
      // focused button would throw focus back to the document (§20.2).
      setIndex(((next % count) + count) % count);
      setMoved(true);
    },
    [count],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Ignore secondary mouse buttons; let the browser handle text selection.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: "undecided",
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;

    if (state.axis === "undecided") {
      if (Math.abs(deltaY) > AXIS_LOCK && Math.abs(deltaY) >= Math.abs(deltaX)) {
        // Vertical intent: release the gesture so the page scrolls normally.
        drag.current = null;
        setDragOffset(0);
        return;
      }
      if (Math.abs(deltaX) <= AXIS_LOCK) return;
      state.axis = "horizontal";
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setDragOffset(deltaX);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    if (!state) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const deltaX = event.clientX - state.startX;
    setDragOffset(0);
    if (state.axis !== "horizontal" || Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    goTo(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
  };

  if (count === 0) return null;

  const labelledBy = heading ? headingId : undefined;

  const header = heading ? (
    <h2 id={headingId} className={styles.heading}>
      {heading}
    </h2>
  ) : null;

  // One testimonial is a quote, not a carousel: no track, no controls, no
  // gesture handling, nothing to announce.
  if (count === 1) {
    return (
      <Section
        surface="off-white"
        aria-labelledby={labelledBy}
        aria-label={heading ? undefined : "Testimonials"}
      >
        <Container>
          {header}
          <div className={styles.single}>
            <TestimonialCard testimonial={testimonials[0]} policy={policy} />
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section
      surface="off-white"
      aria-labelledby={labelledBy}
      aria-label={heading ? undefined : "Testimonials"}
    >
      <Container>
        {header}

        <div
          className={styles.carousel}
          role="group"
          aria-roledescription="carousel"
          aria-label={heading ?? "Testimonials"}
          // Focusable so the arrow keys have somewhere to land (§7.7).
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <div
            className={styles.viewport}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className={styles.track}
              // Derived from state, not from the ref, so the transition is
              // suppressed on exactly the frames that actually move.
              data-dragging={dragOffset !== 0 ? "true" : "false"}
              style={{
                transform: `translate3d(calc(${-activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
              }}
            >
              {testimonials.map((testimonial, slideIndex) => {
                const current = slideIndex === activeIndex;
                return (
                  <div
                    key={testimonial.id}
                    className={styles.slide}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${slideIndex + 1} of ${count}`}
                    aria-hidden={!current}
                    // Keeps off-screen quotes out of the tab order entirely.
                    inert={!current || undefined}
                  >
                    <TestimonialCard testimonial={testimonial} policy={policy} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous testimonial"
            >
              <ArrowLeftIcon />
            </button>

            <ul className={styles.indicators} role="list">
              {testimonials.map((testimonial, slideIndex) => (
                <li key={testimonial.id}>
                  <button
                    type="button"
                    className={cx(
                      styles.indicator,
                      slideIndex === activeIndex && styles.indicatorCurrent,
                    )}
                    aria-label={`Show testimonial ${slideIndex + 1} of ${count}`}
                    aria-current={slideIndex === activeIndex ? "true" : undefined}
                    onClick={() => goTo(slideIndex)}
                  >
                    <span className={styles.indicatorDot} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={styles.arrow}
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next testimonial"
            >
              <ArrowRightIcon />
            </button>
          </div>

          {/* Populated only after the reader moves, so nothing is announced on
              page load. */}
          <p className="visually-hidden" aria-live="polite">
            {moved ? `Slide ${activeIndex + 1} of ${count}` : ""}
          </p>
        </div>
      </Container>
    </Section>
  );
}
