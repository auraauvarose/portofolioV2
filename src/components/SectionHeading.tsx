"use client";

import Reveal from "@/components/Reveal";
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
  return (
    <Reveal className="mb-12 md:mb-16">
      <div className="flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
        {index && <span className="font-display text-accent">{index}</span>}
        <span>{t(kicker)}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <h2 className="text-display mt-4 bg-ink text-4xl uppercase text-white sm:text-5xl md:text-7xl">
        {t(heading)}
      </h2>
    </Reveal>
  );
}
