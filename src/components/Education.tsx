"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Reveal from "@/components/Reveal";
import ScrollWordReveal from "@/components/ScrollWordReveal";
import Tilt3D from "@/components/Tilt3D";
import { useLanguage } from "@/components/providers";
import { useSiteContent } from "@/components/site-content-provider";
import { litMask, nodeFractions } from "@/lib/spine";

/** Period strings that read as "still ongoing" — they get the live dot and
 *  the accent border. Mirrors the check in ExperienceTimeline so both
 *  sections agree on what "present" looks like. */
const CURRENT_WORDS = ["present", "sekarang", "now", "kini", "saat ini"];
const readsCurrent = (period: string) =>
  CURRENT_WORDS.some((w) => period.toLowerCase().includes(w));

/** One glyph per study field, matched by position. Two entries today, so a
 *  fixed pair keeps the markup honest without touching the content config. */
const FIELD_ICONS = [
  // pen tool — visual communication design
  <svg
    key="design"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>,
  // code brackets — informatics
  <svg
    key="code"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="m16 18 6-6-6-6" />
    <path d="m8 6-6 6 6 6" />
  </svg>,
];

export default function Education() {
  const { education } = useSiteContent();
  const { t } = useLanguage();
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLSpanElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  const [touch, setTouch] = useState(false);
  const [active, setActive] = useState(0);
  // Nyala tiap node spine, diturunkan dari progres garis (bukan dari band
  // IntersectionObserver). Lihat komentar di blok useScroll di bawah.
  const [lit, setLit] = useState<boolean[]>([]);
  const fractionsRef = useRef<number[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Which entry is the reader looking at? A card counts as active once it
  // crosses the middle band of the viewport, which is what lights its spine
  // node and tints its panel.
  useEffect(() => {
    const nodes = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.idx);
          if (Number.isFinite(idx)) setActive(idx);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [education.items.length]);

  // Spine fill: the timeline rail draws itself down as the entries scroll by.
  const { scrollYProgress } = useScroll({
    target: cardsRef,
    offset: ["start 0.62", "end 0.72"],
  });
  const spineProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.5,
  });
  const spineScale = useTransform(spineProgress, [0, 1], [0, 1]);

  // Nodes light up from the SAME progress value that drives the fill, so the
  // dot can never lag the line. Each node's position is measured once as a
  // fraction of the rail's length, then re-derived whenever the spring moves.
  const applyLit = useCallback(
    (progress: number) => {
      const fractions = fractionsRef.current;
      if (!fractions.length) return;
      const next =
        reduceMotion || touch
          ? fractions.map(() => true)
          : litMask(progress, fractions);
      setLit((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i])
          ? prev
          : next,
      );
    },
    [reduceMotion, touch],
  );

  const measureFractions = useCallback(() => {
    const container = cardsRef.current;
    const rail = railRef.current;
    if (!container || !rail) return;
    const centres = cardRefs.current.filter(Boolean).map((card) => {
      const node = card!.querySelector<HTMLElement>(".edu-node");
      if (!node) return Number.NaN;
      // Layout offsets ignore the card's entrance transform — exactly what we
      // want. The node's own translateY(-50%) is folded back in via the
      // computed matrix so the maths stays honest if the CSS offset changes.
      let ty = 0;
      const matrix = getComputedStyle(node).transform;
      if (matrix && matrix !== "none") {
        try {
          ty = new DOMMatrixReadOnly(matrix).f;
        } catch {
          ty = 0;
        }
      }
      return card!.offsetTop + node.offsetTop + node.offsetHeight / 2 + ty;
    });
    fractionsRef.current = nodeFractions(
      rail.offsetTop,
      rail.offsetHeight,
      centres,
    );
    applyLit(spineProgress.get());
  }, [applyLit, spineProgress]);

  useLayoutEffect(() => {
    measureFractions();
    const container = cardsRef.current;
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureFractions) : null;
    if (container && ro) ro.observe(container);
    window.addEventListener("resize", measureFractions);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measureFractions);
    };
  }, [measureFractions]);

  useMotionValueEvent(spineProgress, "change", applyLit);

  const items = education.items;
  const ongoing = items.some((item) => readsCurrent(item.period));

  return (
    <section className="relative px-6 py-16 md:px-10 md:py-32">
      <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[minmax(0,320px)_1fr] md:gap-16">
        {/* Sticky rail: kicker + heading stay pinned while cards scroll */}
        <div className="self-start md:sticky md:top-28">
          <Reveal
            variant="left"
            className="mb-6 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400"
          >
            <span className="font-display text-accent">03</span>
            <span>{t(education.kicker)}</span>
            <span className="h-px flex-1 bg-white/10" />
          </Reveal>

          <div className="mb-8">
            <ScrollWordReveal
              as="h2"
              text={t({ en: "Learning journey", id: "Perjalanan belajar" })}
              baseOpacity={0.25}
              className="text-display text-3xl uppercase leading-tight text-white md:text-4xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-gray-500">
            <span>
              {String(items.length).padStart(2, "0")}{" "}
              {t({ en: "Entries", id: "Entri" })}
            </span>
            {ongoing && (
              <>
                <span aria-hidden="true" className="h-3 w-px bg-white/15" />
                <span className="inline-flex items-center gap-2 text-accent">
                  <span aria-hidden="true" className="edu-pulse" />
                  {t({ en: "In progress", id: "Sedang berjalan" })}
                </span>
              </>
            )}
          </div>
        </div>

        <div ref={cardsRef} className="relative space-y-8 md:space-y-12 md:pl-14">
          {/* Timeline rail — one line for the whole list, plus a fill that
              tracks scroll. Nodes live on each card so they always line up. */}
          <span
            ref={railRef}
            aria-hidden="true"
            className="absolute left-[7px] top-4 hidden h-[calc(100%-2rem)] w-px bg-white/10 md:block"
          />
          <motion.span
            aria-hidden="true"
            className="absolute left-[7px] top-4 hidden h-[calc(100%-2rem)] w-px origin-top bg-accent md:block"
            style={reduceMotion || touch ? undefined : { scaleY: spineScale }}
          />

          {items.map((item, i) => (
            <EducationCard
              key={i}
              index={i}
              item={item}
              t={t}
              active={active === i}
              current={readsCurrent(item.period)}
              lit={lit[i] === true}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Bentuk satu entri pendidikan. Struktur sama dengan config.ts. */
type EducationItem = {
  period: string;
  school: string;
  degree: { en: string; id: string };
  detail: { en: string; id: string };
  location: { en: string; id: string };
  description: { en: string; id: string };
};

type Translate = ReturnType<typeof useLanguage>["t"];

function EducationCard({
  index,
  item,
  t,
  active,
  current,
  lit,
  ref,
}: {
  index: number;
  item: EducationItem;
  t: Translate;
  active: boolean;
  current: boolean;
  lit: boolean;
  ref: (node: HTMLDivElement | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const number = String(index + 1).padStart(2, "0");
  const icon = FIELD_ICONS[index % FIELD_ICONS.length];

  // Entrance plays exactly once — a card never re-hides when scrolled back
  // above the fold. transformPerspective keeps the subtle 3D settle readable.
  return (
    <motion.div
      ref={ref}
      data-idx={index}
      initial={
        reduceMotion ? undefined : { opacity: 0, y: 56, rotateX: 7, scale: 0.96 }
      }
      whileInView={
        reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0, scale: 1 }
      }
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={
        reduceMotion ? undefined : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
      }
      style={reduceMotion ? undefined : { transformPerspective: 1000 }}
      className="relative"
    >
      {/* Spine node — sits on the timeline rail, aligned by CSS. It lights up
          from the rail's own scroll progress (the `lit` prop), not from which
          card happens to be centred, so the dot turns orange the moment the
          line reaches it. */}
      <span
        aria-hidden="true"
        className={`edu-node hidden md:flex ${active ? "is-current" : ""} ${
          lit ? "is-done" : ""
        }`}
      >
        <span />
      </span>

      {/* Depth stack: panel → ghost numeral → content plane. Tilt3D rotates
          the whole group while each plane keeps its own translateZ, so the
          copy slides across the numeral instead of moving with it. */}
      <Tilt3D
        className="h-full"
        max={9}
        scale={1.02}
        lift={16}
        glare
        glareClassName="rounded-[1.75rem]"
        innerClassName="edu-stack"
      >
        <span aria-hidden="true" className="edu-panel" />

        <span
          aria-hidden="true"
          className="edu-ghost-wrap tilt-layer"
          style={{ "--tz": "16px" } as React.CSSProperties}
        >
          <span className="edu-ghost">{number}</span>
        </span>

        <article
          className="edu-body tilt-layer"
          style={{ "--tz": "30px" } as React.CSSProperties}
        >
          <div className="grid gap-6 md:grid-cols-[210px_1fr] md:gap-10">
            <div className="md:border-r md:border-white/10 md:pr-8">
              <span className="edu-chip" aria-hidden="true">
                {icon}
              </span>

              <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-accent">
                <span className="edu-index-mark">{number}</span>
                {current && <span aria-hidden="true" className="edu-pulse" />}
                <span>{item.period}</span>
              </p>
              <p className="mt-1 text-sm text-gray-400">{t(item.location)}</p>
            </div>

            <div>
              <ScrollWordReveal
                as="h3"
                text={t(item.degree)}
                baseOpacity={0.2}
                className="text-display text-2xl uppercase text-white md:text-3xl"
              />
              <p className="mt-2 text-sm uppercase tracking-widest text-gray-400">
                {item.school}
              </p>
              <p className="mt-3 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {t(item.detail)}
              </p>
              <ScrollWordReveal
                as="p"
                text={t(item.description)}
                baseOpacity={0.2}
                className="mt-4 leading-relaxed text-gray-300"
              />
            </div>
          </div>
        </article>
      </Tilt3D>
    </motion.div>
  );
}
