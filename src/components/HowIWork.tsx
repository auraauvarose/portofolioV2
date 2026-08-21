"use client";

import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { howIWork } from "@/lib/config";

export default function HowIWork() {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={howIWork.kicker} heading={{ en: "Process", id: "Proses" }} index="06" />

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {howIWork.steps.map((step, i) => (
            <div key={i} className="group relative how-card bg-ink p-8 transition-all hover:bg-panel hover:shadow-[0_12px_40px_-14px_rgba(0,0,0,0.35)] md:p-10">
              <span className="text-display mb-8 block text-6xl text-outline transition-colors group-hover:text-outline-accent md:text-7xl">
                {step.number}
              </span>
              <h3 className="text-display mb-1 text-2xl uppercase text-white">
                {t(step.title)}
              </h3>
              <p className="mb-3 text-sm uppercase tracking-widest text-accent">
                {t(step.subtitle)}
              </p>
              <p className="text-sm leading-relaxed text-gray-400">
                {t(step.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
