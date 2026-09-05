// Shared motion vocabulary — every motion-driven animation on the site
// should pull its curves from here so the whole page moves in one language.
// (CSS-driven systems — .reveal, marquee, grain — keep their own keyframes;
// these tokens are for anything animated via motion/react.)

export const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_INOUT: [number, number, number, number] = [0.76, 0, 0.24, 1];
export const EASE_SPRING_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 140,
  damping: 26,
  mass: 0.6,
} as const;
