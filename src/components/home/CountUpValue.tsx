"use client";

/**
 * Decorative count-up for a single statistic (§7.6, §20.4).
 *
 * The contract, in order of importance:
 *   1. the FINAL value is in the DOM from the server render and never leaves it
 *      — a visually hidden copy carries it, so the accessible name is correct
 *      the instant the markup arrives, whether or not JavaScript ever runs;
 *   2. only an `aria-hidden` copy animates, so assistive technology never hears
 *      a stream of intermediate numbers;
 *   3. `prefers-reduced-motion` skips the animation entirely — the visible copy
 *      simply stays at its final value.
 *
 * The formatter is imported rather than passed in: functions are not
 * serialisable across the server/client boundary, and both sides must agree on
 * the exact string to avoid a hydration mismatch.
 */

import { useEffect, useRef, useState } from "react";
import { formatStatValue } from "./stat-format";

export type CountUpValueProps = {
  value: number;
  prefix?: string;
  suffix?: string;
};

const DURATION_MS = 900;

export function CountUpValue({ value, prefix, suffix }: CountUpValueProps) {
  const formatted = formatStatValue(value);
  // Initial state equals the server markup, so the number is correct before,
  // during and after hydration — no mismatch, no flash of an empty slot.
  const [display, setDisplay] = useState(formatted);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Nothing to count, or motion is unwelcome: leave the final value alone.
    if (prefersReduced || value <= 0 || typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    let start: number | null = null;
    let cancelled = false;

    const step = (timestamp: number) => {
      if (cancelled) return;
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / DURATION_MS);
      // Ease-out, so the number settles instead of snapping.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(formatStatValue(Math.round(value * eased)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      // However this unwinds, the visible copy ends on the real number.
      setDisplay(formatStatValue(value));
    };
  }, [value]);

  return (
    <span ref={ref}>
      <span className="visually-hidden">{`${prefix ?? ""}${formatted}${suffix ?? ""}`}</span>
      <span aria-hidden="true">
        {prefix ?? ""}
        {display}
        {suffix ?? ""}
      </span>
    </span>
  );
}
