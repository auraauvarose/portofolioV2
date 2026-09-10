"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { getScrollDirection } from "@/lib/scroll-direction";

type ScrollWordRevealProps = {
  text: string;
  className?: string;
  /** Opacity each word rests at before its reveal (default 0.25) */
  baseOpacity?: number;
  /** Optional color ramp (base → full) applied while a word reveals */
  baseColor?: string;
  fullColor?: string;
  highlight?: readonly string[];
  highlightClassName?: string;
  /** Seconds between successive words in the cascade (default 0.04) */
  stagger?: number;
  /** Replay the word cascade every time it enters the viewport */
  replay?: boolean;
  as?: "p" | "span" | "h2" | "h3" | "h4" | "div";
  "aria-label"?: string;
};

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** Resolved before first paint on the client (no post-paint flip), so the
 *  first in-view batch and every later batch get the same treatment. */
function useFinePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(FINE_POINTER);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(FINE_POINTER).matches,
    () => false,
  );
}

export default function ScrollWordReveal({
  text,
  className = "",
  baseOpacity = 0.25,
  baseColor,
  fullColor,
  highlight = [],
  highlightClassName = "",
  stagger = 0.04,
  replay = false,
  as: Tag = "p",
  "aria-label": ariaLabel,
}: ScrollWordRevealProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [entryDirection, setEntryDirection] = useState<"from-top" | "from-bottom">("from-bottom");

  useEffect(() => {
    if (replay) getScrollDirection();
  }, [replay]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = Boolean(entry?.isIntersecting);
        if (next && replay) {
          setEntryDirection(
            getScrollDirection() === "up" ? "from-top" : "from-bottom",
          );
        }
        setIsIntersecting(next);
        if (next) setHasEntered(true);
      },
      { threshold: 0.01, rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Touch scrolling can move the page faster than a per-word cascade can
  // settle. On coarse pointers the variants below intentionally collapse to
  // readable, geometry-stable text; fine pointers keep the richer desktop
  // reveal.
  const fine = useFinePointer();

  const words = text.split(/\s+/).filter(Boolean).map((w) => w.trim());
  const norm = (w: string) => w.toLowerCase().replace(/[.,!?;:)]+$/, "");
  const highlightSet = new Set(highlight.map(norm));
  const hasColorRamp = Boolean(baseColor && fullColor);

  const Component = Tag as React.ElementType;

  // Touch devices also use plain, fully-revealed text. A phone can interrupt
  // the parent cascade while scrolling even when the individual word variant
  // is stable, leaving copy partially transparent. Desktop keeps the full
  // reveal because fine pointers can afford the choreography.
  if (reduceMotion || !fine) {
    return (
      <Component className={className} aria-label={ariaLabel ?? text}>
        <span aria-hidden="true">
          {words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className={highlightSet.has(norm(word)) ? highlightClassName : undefined}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </span>
      </Component>
    );
  }

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        // On language changes, reveal the new copy quickly enough that a
        // long paragraph never appears stuck while its words cascade.
        staggerChildren: replay ? Math.min(stagger, 0.018) : stagger,
      },
    },
  };

  const word: Variants = {
    hidden: {
      // A phone can interrupt the cascade while the user is flick-scrolling.
      // Keep touch text readable and geometrically stable instead of leaving
      // words dimmed, offset, and rotated between observer updates.
      opacity: fine ? baseOpacity : 1,
      y: fine && replay && entryDirection === "from-top" ? -14 : fine ? 14 : 0,
      rotateZ:
        fine && replay && entryDirection === "from-top"
          ? -1.2
          : fine
            ? 1.2
            : 0,
      ...(hasColorRamp ? { color: baseColor } : {}),
      ...(fine ? { filter: "blur(7px)" } : {}),
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateZ: 0,
      ...(hasColorRamp ? { color: fullColor } : {}),
      ...(fine ? { filter: "blur(0px)" } : {}),
      transition: {
        duration: replay ? 0.42 : 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <Component className={className} aria-label={ariaLabel ?? text}>
      <span ref={rootRef} className="inline">
        <motion.span
          key={`${text}-${replay ? "replay" : "once"}`}
          className={`inline scroll-word-cascade ${replay ? `cascade-${entryDirection}` : ""}`}
          initial="hidden"
          animate={(replay ? isIntersecting : hasEntered) ? "visible" : "hidden"}
          variants={container}
        >
        {words.map((w, i) => {
          const isHighlighted = highlightSet.has(norm(w));
          return (
            <span key={`${w}-${i}`} aria-hidden="true" className="scroll-word">
              <motion.span
                className={`scroll-word-inner ${isHighlighted ? highlightClassName : ""}`.trim()}
                variants={word}
              >
                {w}
                {i < words.length - 1 ? "\u00A0" : ""}
              </motion.span>
            </span>
          );
          })}
        </motion.span>
      </span>
    </Component>
  );
}
