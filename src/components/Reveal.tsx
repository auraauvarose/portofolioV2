"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [fromTop, setFromTop] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Replays every pass: enter from the bottom edge (scrolling down)
          // slides up; enter from the top edge (scrolling up) slides down.
          setFromTop(entry.boundingClientRect.top <= 0);
          setVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      className={`reveal ${fromTop ? "reveal-from-top" : ""} ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: visible && delay ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Component>
  );
}
