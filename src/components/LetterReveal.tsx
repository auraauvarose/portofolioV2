"use client";

import { useEffect, useRef, useState } from "react";

type LetterRevealProps = {
  text: string;
  className?: string;
};

export default function LetterReveal({ text, className = "" }: LetterRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Replays every pass — animates in both scroll directions.
          setInView(entry.isIntersecting);
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const letters = text.split("");

  return (
    <span ref={ref} className={`inline-block ${className}`} aria-label={text}>
      {letters.map((letter, i) => (
        <span
          key={i}
          aria-hidden
          className={`letter ${inView ? "is-in" : ""}`}
          style={{ transitionDelay: `${i * 28}ms` }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </span>
  );
}
