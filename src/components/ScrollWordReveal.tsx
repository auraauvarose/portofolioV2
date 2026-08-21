"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

type ScrollWordRevealProps = {
  text: string;
  className?: string;
  /** Opacity of words before they've entered their scroll range. Keep it
      readable (0.35–0.5) for body copy so centered text is never illegible —
      0.15 leaves it nearly invisible on a dark background. */
  baseOpacity?: number;
  /** Opacity once a word is fully in its scroll range. */
  fullOpacity?: number;
  /** Fraction (0..1) of viewport travel over which the WHOLE word scan
      completes. Lower = words finish lighting sooner (more readable while
      centered). 0.5–0.6 => the last word is full once the block is centered. */
  scanRange?: number;
  /** Words (case-insensitive, trailing-punctuation-insensitive) to render with
      `highlightClassName` (e.g. brand orange) instead of the default color —
      while still animating opacity through the scroll reveal. */
  highlight?: readonly string[];
  /** Class applied to highlighted words. */
  highlightClassName?: string;
  as?: "p" | "span" | "h2" | "h3" | "h4" | "div";
  /** Aria label override; defaults to the full text so screen readers hear the
      complete sentence instead of per-word fragments. */
  "aria-label"?: string;
};

/**
 * Scroll-linked word reveal ("Apple/Linear style" text illumination).
 *
 * Text is split into per-word <span>s. `useScroll` tracks the container's
 * progress through the viewport; each word then lights up in reading order,
 * tied directly to scroll position (scrolling back up dims it again in real
 * time).
 *
 * HOOKS RULES: every per-word `useTransform` lives inside the small
 * `<RevealWord>` child, so each instance calls exactly ONE hook no matter what
 * the word is. The parent only ever calls a fixed set of hooks (useRef,
 * useReducedMotion, useScroll) — so switching language (which changes the word
 * count) is safe and never trips "rendered fewer/more hooks".
 */
export default function ScrollWordReveal({
  text,
  className = "",
  baseOpacity = 0.4,
  fullOpacity = 1,
  scanRange = 0.6,
  highlight = [],
  highlightClassName = "",
  as: Tag = "p",
  "aria-label": ariaLabel,
}: ScrollWordRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const words = text.split(/\s+/).filter(Boolean).map((w) => w.trim());
  const count = Math.max(words.length, 1);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Punctuation-stripped matching so "Auvarose," matches "Auvarose" (and "—").
  const norm = (w: string) => w.toLowerCase().replace(/[.,!?;:)]+$/, "");
  const highlightSet = new Set(highlight.map(norm));

  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      aria-label={ariaLabel ?? text}
      aria-hidden={false}
    >
      {words.map((word, i) => {
        const isHighlighted = highlightSet.has(norm(word));
        const wordClass = `${
          "scroll-word-inner"
        } ${isHighlighted ? highlightClassName : ""}`.trim();
        return (
          <RevealWord
            key={`${word}-${i}`}
            progress={scrollYProgress}
            index={i}
            count={count}
            baseOpacity={baseOpacity}
            fullOpacity={fullOpacity}
            scanRange={scanRange}
            reduceMotion={reduceMotion}
            className={wordClass}
            isLast={i === words.length - 1}
          >
            {word}
          </RevealWord>
        );
      })}
    </Component>
  );
}

type RevealWordProps = {
  progress: MotionValue<number>;
  index: number;
  count: number;
  baseOpacity: number;
  fullOpacity: number;
  scanRange: number;
  reduceMotion: boolean | null;
  className: string;
  isLast: boolean;
  children: string;
};

/**
 * One word. Calls exactly ONE hook (`useTransform`), so the child's hook count
 * is constant regardless of word text / language — the Rules of Hooks stay
 * satisfied even though the number of rendered words varies.
 */
function RevealWord({
  progress,
  index,
  count,
  baseOpacity,
  fullOpacity,
  scanRange,
  reduceMotion,
  className,
  isLast,
  children,
}: RevealWordProps) {
  const opacity = useTransform(
    progress,
    [(index / count) * scanRange, ((index + 1) / count) * scanRange],
    [baseOpacity, fullOpacity],
  );

  return (
    <span aria-hidden="true" className="scroll-word">
      <motion.span
        className={className}
        style={{ opacity: reduceMotion ? 1 : opacity }}
      >
        {children}
        {/* Non-breaking space kept INSIDE the inline-block so a visible gap
            always separates words (guaranteed not to collapse, and it moves
            with the animated word). `white-space: pre-wrap` on .scroll-word-inner
            preserves it. */}
        {isLast ? "" : "\u00A0"}
      </motion.span>
    </span>
  );
}
