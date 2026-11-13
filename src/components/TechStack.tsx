"use client";

import { useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import {
  cubicBezier,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import { useLanguage } from "@/components/providers";
import { useSiteContent } from "@/components/site-content-provider";
import { getLenis } from "@/components/SmoothScroll";
import { techIcon } from "@/components/tech-icons";
import { techDescriptions, techLinks } from "@/lib/config";
import { EASE_EXPO } from "@/lib/motion";
import type { Localized } from "@/types";

type TechCategory = { title: Localized; items: readonly string[] };

/* Nomor bab section 05. Ditulis sekali saja di sini. */
const CHAPTER = "05";

const UI: Record<string, Localized> = {
  official: { en: "Official site", id: "Situs resmi" },
};

/* Timeline koreografi (revisi t12: rail lebih lambat, judul keluar lebih awal). */
const KEY_IN = 0.02;
const KEY_END = 0.08;
const TITLE_OUT = [0.1, 0.17] as const;
const RAIL_IN = [0.17, 0.22] as const;
/* Satu perpindahan halaman menempati .22–.46; sisanya menahan halaman terakhir. */
const PAGE_MOVE = [0.22, 0.46] as const;
const RAIL_OUT = [0.86, 0.9] as const;
const TITLE_RESTORE = [0.9, 0.98] as const;
/* 8 kartu per halaman: 4 kolom × 2 baris di desktop (2 × 4 baris di mobile),
   16 item → 2 halaman 8/8. */
const PAGE_SIZE = 8;

const SPRING = {
  stiffness: 120,
  damping: 34,
  mass: 0.45,
  restDelta: 0.0005,
} as const;

const CARD =
  "ts-card group/card relative flex h-[clamp(7rem,16svh,11rem)] w-full flex-col rounded-3xl border border-black/10 bg-panel p-3.5 shadow-none md:shadow-[0_28px_70px_-46px_rgba(0,0,0,0.7)] lg:h-[clamp(13rem,30svh,17rem)] lg:p-5 dark:border-white/10";

const CARD_BODY =
  "flex h-full flex-col rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent max-md:min-h-11";

function TechCard({
  label,
  index,
  category,
}: {
  label: string;
  index: number;
  category: string;
}) {
  const { t } = useLanguage();
  const description = techDescriptions[label];
  const link = techLinks[label];

  const body = (
    <>
      <span className="flex items-start gap-2">
        <span className="ts-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-ecru/15 bg-ecru/5 text-ecru/80 lg:h-11 lg:w-11">
          {techIcon(label, "h-4 w-4 lg:h-6 lg:w-6") ?? (
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          )}
        </span>
        <span className="ms-auto font-data text-xs text-ecru/40">
          {String(index).padStart(2, "0")}
        </span>
      </span>

      <h3 className="mt-2 font-display text-[13px] uppercase leading-tight text-ecru transition-colors duration-300 group-hover/card:text-accent lg:mt-4 lg:text-xl">
        {label}
      </h3>

      {description ? (
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ecru/65 lg:mt-2 lg:line-clamp-3 lg:text-sm lg:leading-relaxed">
          {t(description)}
        </p>
      ) : null}

      <span className="mt-auto hidden pt-3 font-data text-xs uppercase tracking-[0.2em] text-accent/80 lg:block">
        {category}
      </span>
    </>
  );

  return (
    <div className={CARD}>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className={CARD_BODY}>
          {body}
        </a>
      ) : (
        <div className={CARD_BODY}>{body}</div>
      )}
    </div>
  );
}

export default function TechStack() {
  const { t } = useLanguage();
  const { techStack } = useSiteContent();

  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLUListElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const lastRailFocus = useRef<Element | null>(null);

  const categories = useMemo(
    () => techStack.categories as readonly TechCategory[],
    [techStack.categories],
  );

  const offsets = useMemo(() => {
    let next = 0;
    return categories.map((cat) => {
      const start = next;
      next += cat.items.length;
      return start;
    });
  }, [categories]);

  /* Satu daftar datar berurutan kategori, lalu dipecah 8 kartu per halaman. */
  const flatItems = useMemo(
    () =>
      categories.flatMap((cat, ci) =>
        cat.items.map((label, ii) => ({
          label,
          category: t(cat.title),
          index: (offsets[ci] ?? 0) + ii + 1,
        })),
      ),
    [categories, offsets, t],
  );

  const pages = useMemo(() => {
    const out: (typeof flatItems)[] = [];
    for (let i = 0; i < flatItems.length; i += PAGE_SIZE) {
      out.push(flatItems.slice(i, i + PAGE_SIZE));
    }
    return out;
  }, [flatItems]);

  const heading = t(techStack.heading);
  const words = useMemo(() => heading.split(/\s+/).filter(Boolean), [heading]);

  // x0/y0 = geseran dari anchor ke tengah stage; pageW = lebar satu halaman rail.
  const [metrics, setMetrics] = useState({ x0: 0, y0: 0, pageW: 0 });
  const [ready, setReady] = useState(false);
  const [railActive, setRailActive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const sp = useSpring(scrollYProgress, SPRING);

  useEffect(() => {
    const stage = stageRef.current;
    const head = headRef.current;
    if (!stage || !head) return;

    let alive = true;
    const measure = () => {
      if (!alive) return;
      const stageW = stage.clientWidth;
      const stageH = stage.clientHeight;
      setMetrics((prev) => {
        const next = {
          x0: Math.round((stageW - head.offsetWidth) / 2 - head.offsetLeft),
          y0: Math.round((stageH - head.offsetHeight) / 2 - head.offsetTop),
          pageW: Math.round(stageW),
        };
        if (
          prev.x0 === next.x0 &&
          prev.y0 === next.y0 &&
          prev.pageW === next.pageW
        ) {
          return prev;
        }
        return next;
      });
      setReady(true);
    };

    measure();
    // Font lokal (Tanker/Cabinet) mengubah lebar judul setelah swap.
    document.fonts?.ready.then(measure).catch(() => {});

    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(head);

    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [categories, t]);

  /* Rail menjadi inert saat fase scroll bergeser. Fokus dipindah ke judul
     SEBELUM inert dipasang supaya pengguna keyboard tidak terlempar ke
     document.body; kalau fokus sudah pindah sendiri, jangan diambil alih. */
  const moveFocusOutOfRail = () => {
    const last = lastRailFocus.current;
    lastRailFocus.current = null;
    if (!last || !railRef.current?.contains(last)) return;
    const active = document.activeElement;
    if (active && active !== document.body && !railRef.current?.contains(active)) {
      return;
    }
    titleRef.current?.focus({ preventScroll: true });
  };

  const railActiveRef = useRef(false);
  useMotionValueEvent(sp, "change", (value) => {
    const active = value >= RAIL_IN[0] && value <= RAIL_OUT[1];
    if (active === railActiveRef.current) return;
    if (!active) moveFocusOutOfRail();
    railActiveRef.current = active;
    setRailActive(active);
  });

  const keyY = useTransform(
    sp,
    [0, KEY_IN, 0.085, KEY_END, 1],
    ["102%", "102%", "-8%", "0%", "0%"],
    { ease: cubicBezier(...EASE_EXPO) },
  );
  const railX = useTransform(
    sp,
    [0, PAGE_MOVE[0], PAGE_MOVE[1], 1],
    [0, 0, -metrics.pageW, -metrics.pageW],
  );
  const railY = useTransform(
    sp,
    [0, RAIL_IN[0], RAIL_IN[1], RAIL_OUT[0], RAIL_OUT[1], 1],
    ["6%", "6%", "0%", "0%", "4%", "4%"],
  );
  const railOpacity = useTransform(
    sp,
    [0, RAIL_IN[0], RAIL_IN[1], RAIL_OUT[0], RAIL_OUT[1], 1],
    [0, 0, 1, 1, 0, 0],
  );
  const titleScale = useTransform(
    sp,
    [0, TITLE_OUT[0], TITLE_OUT[1], RAIL_OUT[0], TITLE_RESTORE[1], 1],
    [1, 1, 0.34, 0.34, 1, 1],
  );
  const titleX = useTransform(
    sp,
    [0, TITLE_OUT[0], TITLE_OUT[1], RAIL_OUT[0], TITLE_RESTORE[1], 1],
    [metrics.x0, metrics.x0, 0, 0, metrics.x0, metrics.x0],
  );
  const titleY = useTransform(
    sp,
    [0, TITLE_OUT[0], TITLE_OUT[1], RAIL_OUT[0], TITLE_RESTORE[1], 1],
    [metrics.y0, metrics.y0, 0, 0, metrics.y0, metrics.y0],
  );
  const titleOpacity = useTransform(
    sp,
    [0, TITLE_OUT[0], TITLE_OUT[1], RAIL_OUT[0], 0.95, 1],
    [1, 1, 0, 0, 1, 1],
  );
  const kickerOpacity = useTransform(
    sp,
    [0, TITLE_OUT[0], TITLE_OUT[1], RAIL_OUT[0], TITLE_RESTORE[1], 1],
    [1, 1, 0.55, 0.55, 1, 1],
  );
  /* Indikator halaman: hanya opacity, satu titik menyala per halaman. */
  const dot1Opacity = useTransform(
    sp,
    [0, PAGE_MOVE[0], PAGE_MOVE[1], 1],
    [1, 1, 0.3, 0.3],
  );
  const dot2Opacity = useTransform(
    sp,
    [0, PAGE_MOVE[0], PAGE_MOVE[1], 1],
    [0.3, 0.3, 1, 1],
  );

  const lastWord = words[words.length - 1] ?? "";
  const lastChar = lastWord.slice(-1);
  const lastPrefix = lastWord.slice(0, -1);

  /* Kartu di luar layar tidak boleh difokus tak terlihat: saat fokus keyboard
     masuk, geser halaman ke progress di mana kartu itu ada di tengah stage.
     Klik/tap tidak menggeser halaman — kalau bergeser sebelum mouseup, link
     di bawah kursor berpindah dan aktivasi klik gagal. */
  const onRailFocus = (event: FocusEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement;
    lastRailFocus.current = target;

    const card = target.closest("li");
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!card || !track || !stage) return;
    if (!target.closest("a")?.matches(":focus-visible")) return;

    const cardRect = card.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    if (cardRect.left >= stageRect.left && cardRect.right <= stageRect.right) {
      return;
    }

    const pageW = metrics.pageW || stage.clientWidth;
    const pageIndex = Math.min(
      Math.max(0, pages.length - 1),
      Math.max(0, Math.floor(card.offsetLeft / Math.max(1, pageW))),
    );
    const ratio = pageIndex / Math.max(1, pages.length - 1);
    const pageProgress = PAGE_MOVE[0] + ratio * (PAGE_MOVE[1] - PAGE_MOVE[0]);
    // Pin useScroll berakhir di (track − tinggi viewport), bukan (track −
    // stage): di mobile 100svh bisa lebih pendek dari innerHeight.
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;
    const top =
      track.getBoundingClientRect().top +
      window.scrollY +
      pageProgress * (track.offsetHeight - viewportH);

    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top, { immediate: true });
    else window.scrollTo({ top, behavior: "auto" });
  };

  return (
    <section className="relative px-6 py-24 max-md:py-16 md:px-10 md:py-32 bg-ink text-ecru">
      <style>{`
.ts-bg {
  background-image: none;
}
/* Judul absolut: anchor kecil di kiri-atas; x0/y0 hasil ukur membawanya ke tengah. */
.ts-head {
  left: 24px;
  top: clamp(3.5rem, 9vh, 5rem);
}
@media (min-width: 768px) {
  .ts-head {
    left: clamp(1.5rem, 6vw, 6rem);
    top: clamp(4.5rem, 11vh, 9rem);
  }
}
/* Mask huruf K: garis dasar selalu tampak, lapisan aksen naik dari bawah. */
.ts-k {
  position: relative;
  display: inline-block;
  overflow: hidden;
  padding-block: 0.06em;
  margin-block: -0.06em;
  vertical-align: bottom;
}
.ts-k-base {
  display: block;
}
.ts-k-accent {
  position: absolute;
  inset: 0;
  display: block;
  color: var(--color-accent);
}
.ts-card {
  transition:
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.4s ease,
    box-shadow 0.4s ease;
}
.ts-card:hover,
.ts-card:focus-within {
  transform: translateY(-4px);
  border-color: var(--color-accent);
}
/* Cincin hover: border-radius: inherit membuat garisnya mengikuti
   lengkung kartu (rounded-3xl), bukan garis lurus seperti corner bracket. */
.ts-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 1px solid var(--color-accent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
  z-index: 2;
}
.ts-card:hover::before,
.ts-card:focus-within::before {
  opacity: 1;
}
.ts-icon {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    transform 0.3s ease;
}
.ts-card:hover .ts-icon,
.ts-card:focus-within .ts-icon {
  background-color: var(--color-accent);
  color: var(--color-a-on-accent);
  transform: translateY(-1px);
}
/* Fallback: pin dilepas total, semua kartu + deskripsi tampil statis. */
@media (prefers-reduced-motion: reduce) {
  .ts-track {
    height: auto;
  }
  .ts-dyn {
    display: none;
  }
  .ts-static {
    display: block;
  }
}
:where(html:not(.js)) .ts-track {
  height: auto;
}
:where(html:not(.js)) .ts-dyn {
  display: none;
}
:where(html:not(.js)) .ts-static {
  display: block;
}
`}</style>

      <div aria-hidden className="ts-bg pointer-events-none absolute inset-0" />

      <div
        ref={trackRef}
        className="ts-track relative -mx-6 -my-16 h-[460vh] max-md:-my-16 md:-mx-10 md:-my-32 max-md:h-[240vh]"
      >
        <div
          ref={stageRef}
          style={{ visibility: ready ? "visible" : "hidden" }}
          className="ts-stage ts-dyn sticky top-0 z-10 h-[100svh] overflow-hidden bg-ink"
        >
          <motion.div
            ref={headRef}
            style={{ x: titleX, y: titleY }}
            className="ts-head pointer-events-none absolute z-10 w-fit"
          >
            <motion.p
              style={{ opacity: kickerOpacity }}
              className="flex items-center justify-center gap-3 font-data text-xs uppercase tracking-[0.28em] text-ecru/60"
            >
              <span className="text-accent">{CHAPTER}</span>
              <span aria-hidden className="h-px w-6 bg-ecru/30" />
              <span>{t(techStack.kicker)}</span>
            </motion.p>

            <motion.h2
              ref={titleRef}
              tabIndex={-1}
              aria-label={heading}
              aria-hidden={railActive || undefined}
              style={{
                scale: titleScale,
                opacity: titleOpacity,
                transformOrigin: "left top",
              }}
              className="mt-4 text-center font-hero uppercase leading-[0.86] tracking-[-0.01em] text-ecru text-[clamp(3rem,17vw,4.75rem)] md:text-[clamp(4rem,11vw,12rem)] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent"
            >
              {words.map((word, wi) => (
                <span key={`${word}-${wi}`} aria-hidden className="block">
                  {wi === words.length - 1 && lastChar ? (
                    <>
                      {lastPrefix}
                      <span className="ts-k">
                        <span className="ts-k-base">{lastChar}</span>
                        <motion.span style={{ y: keyY }} className="ts-k-accent">
                          {lastChar}
                        </motion.span>
                      </span>
                    </>
                  ) : (
                    word
                  )}
                </span>
              ))}
            </motion.h2>
          </motion.div>

          <motion.div
            aria-hidden={!railActive}
            inert={!railActive}
            style={{ x: railX, y: railY, opacity: railOpacity }}
            className="ts-rail-wrap absolute inset-x-0 top-[23vh] z-20 max-md:top-[17vh]"
          >
            <ul
              ref={railRef}
              role="list"
              onFocusCapture={onRailFocus}
              className="ts-rail flex w-full items-stretch"
            >
              {pages.map((page, pi) => (
                <li
                  key={page[0]?.label ?? pi}
                  className="ts-page flex w-full shrink-0 flex-col justify-center px-5 lg:px-12"
                >
                  <div className="flex flex-wrap justify-center gap-2.5 lg:gap-5">
                    {page.map((item) => (
                      <div
                        key={item.label}
                        className="w-[calc((100%-0.625rem)/2)] lg:w-[calc((100%-3.75rem)/4)]"
                      >
                        <TechCard
                          label={item.label}
                          index={item.index}
                          category={item.category}
                        />
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            aria-hidden={!railActive}
            style={{ opacity: railOpacity }}
            className="ts-foot pointer-events-none absolute inset-x-0 bottom-[5vh] z-30 px-6 pb-0.5 md:px-10"
          >
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-4 font-data text-xs uppercase tracking-[0.24em] text-ecru/50 max-md:flex-wrap max-md:gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-ecru">{CHAPTER}</span>
                <span aria-hidden className="text-ecru/25">
                  /
                </span>
                <span>{heading}</span>
              </div>
              <div aria-hidden className="mt-4 flex gap-2">
                <motion.span
                  style={{ opacity: dot1Opacity }}
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                />
                <motion.span
                  style={{ opacity: dot2Opacity }}
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                />
              </div>
              <div aria-hidden className="mt-4 h-px w-full bg-ecru/15">
                <motion.div
                  style={{ scaleX: sp }}
                  className="h-full origin-left bg-accent"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fallback statis: satu-satunya isi yang terbaca saat reduced-motion / tanpa JS. */}
        <div className="ts-static hidden px-6 py-24 max-md:py-16 md:px-10 md:py-32">
          <div className="mx-auto max-w-7xl">
            <p className="font-data text-xs uppercase tracking-[0.28em] text-ecru/60">
              <span className="text-accent">{CHAPTER}</span>
              <span aria-hidden className="mx-3 inline-block h-px w-6 align-middle bg-ecru/30" />
              {t(techStack.kicker)}
            </p>
            <h2 className="mt-3 font-hero uppercase leading-[0.9] text-ecru text-[clamp(3rem,17vw,4.75rem)] md:text-[clamp(4rem,11vw,12rem)]">
              {heading}
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {categories.map((cat, ci) => (
                <section
                  key={cat.title.en}
                  aria-labelledby={`ts-static-cat-${ci}`}
                  className="rounded-3xl border border-black/10 bg-panel p-6 max-md:p-4 dark:border-white/10"
                >
                  <h3
                    id={`ts-static-cat-${ci}`}
                    className="font-data text-xs uppercase tracking-[0.2em] text-accent"
                  >
                    {CHAPTER}.{ci + 1} — {t(cat.title)}
                  </h3>
                  <ul className="mt-4 flex flex-col gap-4">
                    {cat.items.map((label) => {
                      const description = techDescriptions[label];
                      const link = techLinks[label];
                      return (
                        <li key={label}>
                          <span className="font-display text-base uppercase text-ecru">
                            {label}
                          </span>
                          {description ? (
                            <p className="mt-1 text-sm leading-relaxed text-ecru/65">
                              {t(description)}
                            </p>
                          ) : null}
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center font-data text-xs uppercase tracking-[0.2em] text-accent/80 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent max-md:min-h-11"
                            >
                              {t(UI.official)}
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
