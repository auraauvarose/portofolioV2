export const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_INOUT: [number, number, number, number] = [0.76, 0, 0.24, 1];
export const EASE_SPRING_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 140,
  damping: 26,
  mass: 0.6,
} as const;
