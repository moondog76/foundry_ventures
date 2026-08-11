"use client";

/**
 * Scroll reveal (§5.6, §18.5).
 *
 * The contract that makes this safe: the element is **visible in server
 * markup**. The hidden state is only applied by this component after mount, so
 * if JavaScript or IntersectionObserver fails, the content is simply there.
 *
 * State lives in the DOM rather than in React state on purpose — the reveal is
 * a one-shot visual side effect on an external system, so driving it through a
 * `data-` attribute avoids a cascading re-render for something that never
 * affects the tree. It runs once, and `prefers-reduced-motion` skips it.
 */

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import styles from "./ui.module.css";
import { cx } from "./index";

export type RevealProps = {
  children: ReactNode;
  /** Stagger in ms for sequenced reveals; capped by the caller (§5.6). */
  delay?: number;
  distance?: number;
  className?: string;
  as?: ElementType;
};

export function Reveal({
  children,
  delay = 0,
  distance = 16,
  className,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") return;

    // Already in view on mount (above the fold): leave it visible, no flicker.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    const show = () => {
      if (delay) node.style.transitionDelay = `${delay}ms`;
      node.dataset.reveal = "visible";
    };

    node.dataset.reveal = "pending";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show();
          observer.disconnect();
        }
      },
      // Start just before the element is fully visible (§18.5).
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag
      ref={ref}
      className={cx(styles.reveal, className)}
      style={{ "--reveal-distance": `${distance}px` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
