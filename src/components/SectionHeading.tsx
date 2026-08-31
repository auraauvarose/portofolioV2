"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/providers";
import type { Localized } from "@/types";

export default function SectionHeading({
  kicker,
  heading,
  index,
}: {
  kicker: Localized;
  heading: Localized;
  index?: string;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [fromTop, setFromTop] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Replays on every pass, both scroll directions: words drop back
          // behind their masks when the heading leaves the viewport.
          setFromTop(entry.boundingClientRect.top <= 0);
          setVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const words = t(heading).split(/\s+/).filter(Boolean);

  return (
    <div
      ref={ref}
      className={`sh mb-12 md:mb-16 ${fromTop ? "sh-from-top" : ""} ${visible ? "sh-in" : ""}`}
    >
      <div className="flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
        {index && <span className="sh-index font-display text-accent">{index}</span>}
        <span className="sh-kicker">{t(kicker)}</span>
        <span className="sh-line h-px flex-1 bg-white/10" />
      </div>
      <h2
        aria-label={t(heading)}
        className="text-bevellier mt-4 bg-ink text-4xl uppercase text-white sm:text-5xl md:text-7xl"
      >
        {words.map((word, i) => (
          <span key={`${word}-${i}`} aria-hidden="true" className="sh-mask">
            <span
              className="sh-word"
              style={{ transitionDelay: `${140 + i * 70}ms` }}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
}
