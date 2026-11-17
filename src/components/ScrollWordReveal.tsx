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
  baseOpacity?: number;
  baseColor?: string;
  fullColor?: string;
  highlight?: readonly string[];
  highlightClassName?: string;
  stagger?: number;
  replay?: boolean;
  scrub?: boolean;
  as?: "p" | "span" | "h2" | "h3" | "h4" | "div";
  "aria-label"?: string;
};

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

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
  // Tier perangkat (data-tier, di-set pra-paint oleh layout) hanya menyetel
  // waktu & spring reveal — bukan tampilan. Tier "off" sudah ditangani cabang
  // reduceMotion di bawah, jadi di sini cukup "high" vs sisanya.
  const tier = globalThis.document?.documentElement.dataset.tier === "high" ? "high" : "low";
  const rootRef = useRef<HTMLSpanElement>(null);
  // The scrub window ends at the reading line (55% viewport height), not at
  // the top edge (14%). Ending at 14% kept the last word blurred until the
  // heading had passed the middle of the screen — exactly while it was being
  // read, so the blur outlasted its welcome. Ending at 55% makes every word
  // sharp right as the heading arrives at the reading position.
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start 0.86", "start 0.55"],
  });
  const scrubProgress = useSpring(scrollYProgress, {
    // Tier kuat: spring lebih gesit (hidup). Tier lemah/off: lebih teredam halus.
    stiffness: tier === "high" ? 165 : 125,
    damping: tier === "high" ? 26 : 34,
    mass: tier === "high" ? 0.4 : 0.5,
    restDelta: 0.0005,
  });
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [entryDirection, setEntryDirection] = useState<"from-top" | "from-bottom">("from-bottom");

  const fine = useFinePointer();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fine]);

  const words = text.split(/\s+/).filter(Boolean).map((w) => w.trim());
  const norm = (w: string) => w.toLowerCase().replace(/[.,!?;:)]+$/, "");
  const highlightSet = new Set(highlight.map(norm));
  const hasColorRamp = Boolean(baseColor && fullColor);

  const Component = Tag as React.ElementType;

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

  // HP/touch: cascade ringan sekali jalan (opacity + translate per kata).
  // Sebelumnya cabang ini mengembalikan teks statis tanpa gerak, dan mode
  // scrub menulis motion value tiap frame — dua-duanya bukan pengalaman HP
  // yang halus. Cascade menaruh seluruh biaya di compositor.
  if (!fine) {
    const revealed = replay ? isIntersecting : hasEntered;

    return (
      <Component className={className} aria-label={ariaLabel ?? text}>
        <span
          ref={rootRef}
          className={`inline sw-cascade ${revealed ? "is-revealed" : ""}`}
          style={{ "--sw-base": baseOpacity } as React.CSSProperties}
        >
          {words.map((word, i) => (
            <span key={`${word}-${i}`} aria-hidden="true" className="scroll-word">
              <span
                className={`scroll-word-inner ${highlightSet.has(norm(word)) ? highlightClassName : ""}`.trim()}
                style={{ "--sw-i": Math.min(i, 24) } as React.CSSProperties}
              >
                {word}
                {i < words.length - 1 ? "\u00A0" : ""}
              </span>
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

  // Amplitudo & waktu reveal per tier: high lebih hidup, low lebih halus.
  const lift = tier === "high" ? 18 : 8;
  const tilt = tier === "high" ? 1.6 : 0.6;
  const blurFrom = tier === "high" ? 9 : 5;
  const revealDuration = tier === "high" ? (replay ? 0.36 : 0.55) : replay ? 0.55 : 0.9;

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: replay
          ? Math.min(stagger, 0.018)
          : tier === "high"
            ? stagger
            : stagger * 0.6,
      },
    },
  };

  const word: Variants = {
    hidden: {
      opacity: fine ? baseOpacity : 1,
      y: fine && replay && entryDirection === "from-top" ? -lift : fine ? lift : 0,
      rotateZ:
        fine && replay && entryDirection === "from-top"
          ? -tilt
          : fine
            ? tilt
            : 0,
      ...(hasColorRamp ? { color: baseColor } : {}),
      ...(fine ? { filter: `blur(${blurFrom}px)` } : {}),
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateZ: 0,
      ...(hasColorRamp ? { color: fullColor } : {}),
      ...(fine ? { filter: "blur(0px)" } : {}),
      transition: {
        duration: revealDuration,
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
