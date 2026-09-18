"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
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
  /** Link each word's reveal progress to scroll position in both directions */
  scrub?: boolean;
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

type ScrubWordProps = {
  word: string;
  trailingSpace: boolean;
  progress: MotionValue<number>;
  range: [number, number];
  baseOpacity: number;
  baseColor?: string;
  fullColor?: string;
  className: string;
  fine: boolean;
};

function ScrubWord({
  word,
  trailingSpace,
  progress,
  range,
  baseOpacity,
  baseColor,
  fullColor,
  className,
  fine,
}: ScrubWordProps) {
  // Hooks stay unconditional (rules of hooks); the filter only reaches the
  // DOM on fine pointers so touch GPUs never rasterize a blurred layer.
  const opacity = useTransform(progress, range, [baseOpacity, 1]);
  const blur = useTransform(progress, range, [8, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;
  const color = useTransform(progress, range, [baseColor ?? "#000000", fullColor ?? "#000000"]);

  return (
    <span className="scroll-word" aria-hidden="true">
      <motion.span
        className={`scroll-word-inner ${className}`.trim()}
        style={{
          opacity,
          ...(fine ? { filter } : {}),
          ...(baseColor && fullColor ? { color } : {}),
        }}
      >
        {word}
        {trailingSpace ? "\u00A0" : ""}
      </motion.span>
    </span>
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
  scrub = false,
  as: Tag = "p",
  "aria-label": ariaLabel,
}: ScrollWordRevealProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start 0.86", "start 0.14"],
  });
  const scrubProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 28,
    mass: 0.45,
    restDelta: 0.0005,
  });
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
    // Sengaja sekali jalan: IntersectionObserver mengikat elemen yang sama
    // seumur komponen, jadi memasang ulang tidak ada gunanya.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Touch scrolling can move the page faster than a per-word cascade can
  // settle, and touch GPUs re-raster filtered text every frame. Coarse
  // pointers therefore collapse the timed cascade to readable,
  // geometry-stable text and scrub with opacity/color only (no filter, no
  // spring); fine pointers keep the richer desktop reveal.
  const fine = useFinePointer();

  const words = text.split(/\s+/).filter(Boolean).map((w) => w.trim());
  const norm = (w: string) => w.toLowerCase().replace(/[.,!?;:)]+$/, "");
  const highlightSet = new Set(highlight.map(norm));
  const hasColorRamp = Boolean(baseColor && fullColor);

  const Component = Tag as React.ElementType;

  // Reduced-motion users get stable, fully-readable copy. Scrub mode stays
  // available on coarse pointers too, but there it binds straight to scroll
  // position with opacity/color only; fine pointers keep the full
  // blur-to-sharp spring reveal.
  if (reduceMotion) {
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

  if (scrub) {
    const wordSpan = Math.min(0.7, 6 / words.length);

    return (
      <Component className={className} aria-label={ariaLabel ?? text}>
        <span ref={rootRef} className="inline">
          <span className="inline scroll-word-cascade">
            {words.map((word, i) => (
              <ScrubWord
                key={`${word}-${i}`}
                word={word}
                trailingSpace={i < words.length - 1}
                progress={fine ? scrubProgress : scrollYProgress}
                fine={fine}
                range={[i / words.length, Math.min(1, i / words.length + wordSpan)]}
                baseOpacity={baseOpacity}
                baseColor={baseColor}
                fullColor={fullColor}
                className={highlightSet.has(norm(word)) ? highlightClassName : ""}
              />
            ))}
          </span>
        </span>
      </Component>
    );
  }

  // Timed cascades remain reserved for fine pointers. This keeps the
  // existing desktop choreography stable for other sections using this
  // shared component while About/What I Do opt into scrub mode.
  if (!fine) {
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
