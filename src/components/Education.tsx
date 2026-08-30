"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Reveal from "@/components/Reveal";
import ScrollWordReveal from "@/components/ScrollWordReveal";
import { useLanguage } from "@/components/providers";
import { education } from "@/lib/config";

export default function Education() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.7", "end 0.7"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.5,
  });
  const lineScale = useTransform(progress, [0, 1], [0, 1]);

  return (
    <section ref={sectionRef} className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[minmax(0,320px)_1fr] md:gap-16">
        {/* Sticky rail: kicker + scroll progress line stay pinned while cards scroll */}
        <div className="self-start md:sticky md:top-28">
          <Reveal className="mb-6 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
            <span className="font-display text-accent">03</span>
            <span>{t(education.kicker)}</span>
            <span className="h-px flex-1 bg-white/10" />
          </Reveal>
          <div className="mb-8 hidden md:block">
            <ScrollWordReveal
              as="h2"
              text={t({ en: "Learning journey", id: "Perjalanan belajar" })}
              baseOpacity={0.25}
              scanRange={0.9}
              offset={["start end", "start 0.5"]}
              className="text-display text-3xl uppercase leading-tight text-white"
            />
          </div>
          <div className="hidden h-48 w-px bg-white/10 md:block">
            <motion.div
              className="h-full w-px origin-top bg-accent"
              style={reduceMotion ? undefined : { scaleY: lineScale }}
            />
          </div>
        </div>

        <div className="space-y-8 md:space-y-12">
          {education.items.map((item, i) => (
            <EducationCard key={i} index={i} item={item} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

type EducationItem = (typeof education.items)[number];

type Translate = ReturnType<typeof useLanguage>["t"];

function EducationCard({
  index,
  item,
  t,
}: {
  index: number;
  item: EducationItem;
  t: Translate;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  // Scroll-scrubbed reveal: card animates in as it travels up the viewport
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.35"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.5,
  });
  const opacity = useTransform(smooth, [0, 1], [0, 1]);
  const y = useTransform(smooth, [0, 1], [64, 0]);
  const rotateX = useTransform(smooth, [0, 1], [8, 0]);
  const scale = useTransform(smooth, [0, 1], [0.95, 1]);

  return (
    <motion.div
      ref={ref}
      style={
        reduceMotion
          ? undefined
          : { opacity, y, rotateX, scale, transformPerspective: 1000 }
      }
    >
      <div className="group grid gap-6 rounded-2xl border border-white/10 bg-panel p-8 transition-colors duration-500 hover:border-ink/20 hover:bg-accent md:grid-cols-[240px_1fr] md:p-10">
        <div>
          <p className="text-sm font-medium text-accent transition-colors duration-500 group-hover:text-ink">
            <span className="mr-2 font-display text-white/15 transition-colors duration-500 group-hover:text-ink/30">
              0{index + 1}
            </span>
            {item.period}
          </p>
          <p className="mt-1 text-sm text-gray-400 transition-colors duration-500 group-hover:text-ink/70">
            {t(item.location)}
          </p>
        </div>
        <div>
          <ScrollWordReveal
            as="h3"
            text={t(item.degree)}
            baseOpacity={0.2}
            scanRange={0.9}
            offset={["start end", "start 0.5"]}
            className="text-display text-2xl uppercase text-white transition-colors duration-500 group-hover:text-ink md:text-3xl"
          />
          <p className="mt-1 text-sm uppercase tracking-widest text-gray-400 transition-colors duration-500 group-hover:text-ink/70">
            {item.school}
          </p>
          <p className="mt-2 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-colors duration-500 group-hover:border-ink/30 group-hover:bg-ink/10 group-hover:text-ink">
            {t(item.detail)}
          </p>
          <ScrollWordReveal
            as="p"
            text={t(item.description)}
            baseOpacity={0.2}
            fullOpacity={1}
            scanRange={0.9}
            offset={["start end", "start 0.45"]}
            className="mt-4 leading-relaxed text-gray-300 transition-colors duration-500 group-hover:text-ink/80"
          />
        </div>
      </div>
    </motion.div>
  );
}
