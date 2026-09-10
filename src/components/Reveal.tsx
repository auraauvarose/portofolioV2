"use client";

import { useEffect, useRef, useState } from "react";
import { getScrollDirection } from "@/lib/scroll-direction";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  /** Media variant: images inside un-clip from a zoomed-in state */
  media?: boolean;
  /** Entrance flavor */
  variant?: "rise" | "left" | "right" | "zoom" | "flip";
  /** Replay while entering/leaving the viewport instead of playing once */
  replay?: boolean;
};

const VARIANT_CLASS: Record<NonNullable<RevealProps["variant"]>, string> = {
  rise: "",
  left: "v-left",
  right: "v-right",
  zoom: "v-zoom",
  flip: "v-flip",
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  media = false,
  variant = "rise",
  replay = false,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [entryDirection, setEntryDirection] = useState<"from-top" | "from-bottom">("from-bottom");

  useEffect(() => {
    if (replay) getScrollDirection();
  }, [replay]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (replay) {
              setEntryDirection(
                getScrollDirection() === "up" ? "from-top" : "from-bottom",
              );
            }
            setVisible(true);
            if (!replay) {
              // Default behavior: play once and keep the final state.
              observer.disconnect();
            }
          } else if (replay) {
            // Replay mode is intentionally opt-in for About/What I Do only.
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [replay]);

  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      className={`reveal ${media ? "reveal-media" : ""} ${VARIANT_CLASS[variant]} ${replay ? `replay-${entryDirection}` : ""} ${visible ? "is-visible" : ""} ${className}`}
      // Backwards fill holds the from-state for the whole delay, so grid
      // stagger stays invisible until each card's turn.
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
