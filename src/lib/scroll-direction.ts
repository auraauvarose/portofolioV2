export type ScrollDirection = "up" | "down";

let direction: ScrollDirection = "down";
let previousY = 0;
let listening = false;

function ensureListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  previousY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const currentY = window.scrollY;
      if (currentY !== previousY) {
        direction = currentY < previousY ? "up" : "down";
        previousY = currentY;
      }
    },
    { passive: true },
  );
}

export function getScrollDirection(): ScrollDirection {
  ensureListener();
  return direction;
}
