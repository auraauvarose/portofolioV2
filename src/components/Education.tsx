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
import MobileCarousel from "@/components/MobileCarousel";
import { useLanguage } from "@/components/providers";
import { useSiteContent } from "@/components/site-content-provider";
import { litMask, nodeFractions } from "@/lib/spine";

const CURRENT_WORDS = ["present", "sekarang", "now", "kini", "saat ini"];
const readsCurrent = (period: string) =>
  CURRENT_WORDS.some((w) => period.toLowerCase().includes(w));

export default function Education() {
  const { education } = useSiteContent();
  const { t } = useLanguage();
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLSpanElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  const [touch, setTouch] = useState(false);
  const [active, setActive] = useState(0);
  const [slide, setSlide] = useState(0);
  const [lit, setLit] = useState<boolean[]>([]);
  const fractionsRef = useRef<number[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-500">
            <span>
              {String(items.length).padStart(2, "0")}{" "}
              {t({ en: "Entries", id: "Entri" })}
            </span>
            {ongoing && (
              <>
                <span aria-hidden="true" className="h-3 w-px bg-white/15" />
                <span className="inline-flex items-center gap-2 text-accent">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                  />
                  {t({ en: "In progress", id: "Sedang berjalan" })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Desktop: daftar vertikal dengan garis waktu yang menyala saat discroll.
            Di HP daftar ini tidak dirender sama sekali — lihat blok carousel di
            bawah — supaya pengukuran spine tidak pernah melihat elemen tersembunyi
            yang tinggi dan lebarnya nol. */}
        <div ref={cardsRef} className="edu-list relative hidden md:block md:pl-14">
          <span ref={railRef} aria-hidden="true" className="edu-rail" />
          <motion.span
            aria-hidden="true"
            className="edu-rail edu-rail-fill"
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

        {/* Mobile: satu entri per slide, geser kiri/kanan. */}
        <div className="edu-slides md:hidden">
          {items.length > 0 &&
            (() => {
              const idx = Math.min(slide, items.length - 1);
              return (
                <MobileCarousel
                  total={items.length}
                  idx={idx}
                  onSlide={setSlide}
                  revealClassName="h-auto"
                >
                  <EducationCard
                    index={idx}
                    item={items[idx]}
                    t={t}
                    /* Sengaja false: penanda posisi di HP sudah dibawa progress
                       rail carousel, jadi border bawah kartu tidak perlu ikut
                       menyala — dua penanda oranye berdekatan hanya jadi riuh. */
                    active={false}
                    current={readsCurrent(items[idx].period)}
                    lit
                    entrance={false}
                  />
                </MobileCarousel>
              );
            })()}
        </div>
      </div>
    </section>
  );
}

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
  entrance = true,
  ref,
}: {
  index: number;
  item: EducationItem;
  t: Translate;
  active: boolean;
  current: boolean;
  lit: boolean;
  /** Animasi masuk saat discroll. Dimatikan di carousel HP, karena perpindahan
   *  slide sudah dianimasikan oleh MobileCarousel — dua animasi masuk pada satu
   *  elemen membuat teks sempat tak terlihat. */
  entrance?: boolean;
  ref?: (node: HTMLDivElement | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const number = String(index + 1).padStart(2, "0");
  const animate = entrance && !reduceMotion;

  return (
    <motion.div
      ref={ref}
      data-idx={index}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={animate ? { once: true, margin: "0px 0px -10% 0px" } : undefined}
      transition={animate ? { duration: 0.6, ease: [0.16, 1, 0.3, 1] } : undefined}
      className={`edu-row${active ? " is-focus" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`edu-node${lit ? " is-done" : ""}${
          current ? " is-current" : ""
        }`}
      />

      <div className="edu-meta">
        <span className="edu-index-mark">{number}</span>
        <span className={`edu-period${current ? " is-current" : ""}`}>
          {item.period}
        </span>
        <span className="edu-loc">{t(item.location)}</span>
      </div>

      <div>
        <h3 className="text-display text-2xl uppercase text-white md:text-3xl">
          {t(item.degree)}
        </h3>
        <p className="edu-school">{item.school}</p>
        <span className="edu-detail">{t(item.detail)}</span>
        <p className="edu-desc">{t(item.description)}</p>
      </div>
    </motion.div>
  );
}
