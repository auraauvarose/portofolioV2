"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from "motion/react";

type ScrollWordRevealProps = {
  text: string;
  className?: string;
  /** Scroll window for the reveal; default completes when the element exits the top */
  offset?: UseScrollOptions["offset"];
  baseOpacity?: number;
  fullOpacity?: number;
  scanRange?: number;
  baseColor?: string;
  fullColor?: string;
  highlight?: readonly string[];
  highlightClassName?: string;
  as?: "p" | "span" | "h2" | "h3" | "h4" | "div";
  "aria-label"?: string;
};

export default function ScrollWordReveal({
  text,
  className = "",
  offset = ["start end", "end start"] as UseScrollOptions["offset"],
  baseOpacity = 0.4,
  fullOpacity = 1,
  scanRange = 0.6,
  baseColor,
  fullColor,
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
    offset,
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.6,
  });

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
            progress={smooth}
            index={i}
            count={count}
            baseOpacity={baseOpacity}
            fullOpacity={fullOpacity}
            scanRange={scanRange}
            baseColor={baseColor}
            fullColor={fullColor}
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

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type RevealWordProps = {
  progress: MotionValue<number>;
  index: number;
  count: number;
  baseOpacity: number;
  fullOpacity: number;
  scanRange: number;
  baseColor?: string;
  fullColor?: string;
  reduceMotion: boolean | null;
  className: string;
  isLast: boolean;
  children: string;
};

function RevealWord({
  progress,
  index,
  count,
  baseOpacity,
  fullOpacity,
  scanRange,
  baseColor,
  fullColor,
  reduceMotion,
  className,
  isLast,
  children,
}: RevealWordProps) {
  const input: [number, number] = [
    (index / count) * scanRange,
    ((index + 1) / count) * scanRange,
  ];
  const t = useTransform(progress, input, [0, 1]);
  const eased = useTransform(t, (v) => easeOutCubic(v));
  const opacity = useTransform(eased, [0, 1], [baseOpacity, fullOpacity]);
  const color = useTransform(eased, [0, 1], [
    baseColor ?? "currentColor",
    fullColor ?? "currentColor",
  ]);
  const y = useTransform(eased, [0, 1], [12, 0]);
  const blur = useTransform(eased, [0, 1], [6, 0]);
  const colorStyle: { color: string | MotionValue<string> } | null =
    baseColor && fullColor
      ? { color: reduceMotion ? fullColor : color }
      : null;

  return (
    <span aria-hidden="true" className="scroll-word">
      <motion.span
        className={className}
        style={{
          opacity: reduceMotion ? 1 : opacity,
          y: reduceMotion ? 0 : y,
          filter: reduceMotion ? "none" : `blur(${blur}px)`,
          ...colorStyle,
        }}
      >
        {children}
        {isLast ? "" : "\u00A0"}
      </motion.span>
    </span>
  );
}
