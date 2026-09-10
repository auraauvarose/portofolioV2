"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/** Hairline accent bar pinned to the top of the viewport. The fill tracks
 *  overall page scroll with a light spring so it glides instead of ticking. */
export default function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 170,
    damping: 32,
    mass: 0.4,
  });

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-[2.5px] w-full origin-left bg-accent"
      style={{ scaleX }}
    />
  );
}
