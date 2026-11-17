"use client";

import { useEffect, useRef, useState } from "react";
import { getScrollDirection } from "@/lib/scroll-direction";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  media?: boolean;
  variant?: "rise" | "left" | "right" | "zoom" | "flip";
  replay?: boolean;
};

const VARIANT_CLASS: Record<NonNullable<RevealProps["variant"]>, string> = {
  rise: "",
  left: "v-left",
  right: "v-right",
  zoom: "v-zoom",
  flip: "v-flip",
};

// ponytail: variasi dari delay; koreografi khusus tetap memakai prop variant.
const DEFAULT_VARIANTS = ["rise", "left", "right", "flip"] as const;

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  media = false,
  variant = media && delay === 0
    ? "zoom"
    : (DEFAULT_VARIANTS[Math.floor(delay / 70) % DEFAULT_VARIANTS.length] ?? "rise"),
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
    // Di HP, -24px membuat banyak kartu sudah selesai beranimasi sebelum
    // benar-benar terlihat; -40px menahannya sampai elemen masuk layar.
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
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
              observer.disconnect();
            }
          } else if (replay) {
            setVisible(false);
          }
        }
      },
      {
        threshold: 0.01,
        rootMargin: coarse ? "0px 0px -40px 0px" : "0px 0px -24px 0px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [replay]);

  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      className={`reveal ${media ? "reveal-media" : ""} ${VARIANT_CLASS[variant]} ${replay ? `replay-${entryDirection}` : ""} ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
