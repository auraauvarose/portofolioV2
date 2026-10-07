"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import Reveal from "@/components/Reveal";
import ScrollWordReveal from "@/components/ScrollWordReveal";
import Tilt3D from "@/components/Tilt3D";
import { useLanguage } from "@/components/providers";
import { useSiteContent } from "@/components/site-content-provider";

const CURRENT_WORDS = ["present", "sekarang", "now", "kini", "saat ini"];
const readsCurrent = (period: string) =>
  CURRENT_WORDS.some((w) => period.toLowerCase().includes(w));

/* Dua kedalaman yang membentuk ruang di dalam pita. Angka indeks didorong jauh
   ke belakang sehingga mengecil dan bergerak paling lambat saat pita miring;
   judul gelar diangkat sedikit ke depan. Selisih laju keduanya yang terbaca
   sebagai kedalaman — bukan bayangan atau bingkai bertumpuk.

   Judul hanya diangkat 34px, bukan lebih. Perspektif Tilt3D ada di 1100px, jadi
   translateZ(z) memperbesar elemen sebesar 1100 / (1100 - z) terhadap titik
   tengah pita: 34px berarti ~3,2%, dan judul sudah memakai hampir seluruh lebar
   pita. Di 60px (~5,8%) tepi kanannya mulai menyentuh padding.

   Ditulis sebagai CSSProperties karena `--edu-depth` adalah custom property. */
const GHOST_DEPTH = { "--edu-depth": "-110px" } as CSSProperties;
const TITLE_DEPTH = { "--edu-depth": "34px" } as CSSProperties;

export default function Education() {
  const { education } = useSiteContent();
  const { t } = useLanguage();
  const bandRefs = useRef<(HTMLElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(-1);

  // Pita yang sedang dibaca ditandai: garis atasnya menyala dan angka latarnya
  // ikut terangkat. Satu penanda saja per pita — menandai sekaligus tepi, angka,
  // dan judul membuat tiga isyarat berbeda untuk satu keadaan yang sama.
  useEffect(() => {
    const nodes = bandRefs.current.filter(Boolean) as HTMLElement[];
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

  const items = education.items;
  const ongoing = items.some((item) => readsCurrent(item.period));

  return (
    <section id="education" className="relative py-16 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
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
            className="text-bricolage text-4xl uppercase text-white md:text-6xl"
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

      {/* Pita entri. Sengaja tidak berada di dalam kontainer berlebar maksimum:
          garis pemisahnya harus berjalan dari tepi ke tepi layar, sementara
          isinya tetap sejajar dengan judul section di atasnya. */}
      <div className="mt-14 md:mt-20">
        {items.map((item, i) => (
          <EducationBand
            key={i}
            index={i}
            item={item}
            t={t}
            active={active === i}
            current={readsCurrent(item.period)}
            /* Hanya reduced-motion yang mematikan seluruh gerak. Perangkat
               sentuh TIDAK dimatikan di sini: Tilt3D sudah punya deteksi gestur
               sendiri — geser mendatar memiringkan pita, geser tegak tetap
               menggulir halaman — jadi mematikannya justru membuang efek 3D di
               HP. Pita ini juga tidak punya geser-mendatar untuk pindah slide,
               jadi tidak ada gestur yang diperebutkan. */
            still={Boolean(reduceMotion)}
            ref={(node) => {
              bandRefs.current[i] = node;
            }}
          />
        ))}
        <span aria-hidden="true" className="edu-band-rule block" />
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

function EducationBand({
  index,
  item,
  t,
  active,
  current,
  still,
  ref,
}: {
  index: number;
  item: EducationItem;
  t: Translate;
  active: boolean;
  current: boolean;
  /** Mematikan seluruh gerak, termasuk animasi masuk. Hanya untuk reduced-motion. */
  still: boolean;
  ref?: (node: HTMLElement | null) => void;
}) {
  const number = String(index + 1).padStart(2, "0");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);

  // Pita masuk dengan rebah: tepi atasnya terangkat lalu turun ke bidang baca.
  // Pemicunya IntersectionObserver sendiri, bukan whileInView milik motion.
  // whileInView di sini tidak pernah menyala — dengan margin persen, pita yang
  // sudah berada di tengah layar pun tetap tertahan di keadaan awal (opacity 0),
  // dan isi section jadi kosong. Observer eksplisit tidak bergantung pada
  // semantik margin itu, dan sama dengan pola yang dipakai ScrollWordReveal.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    if (still) {
      setEntered(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setEntered(true);
          io.disconnect();
          return;
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -14% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [still]);

  return (
    <article
      ref={ref}
      data-idx={index}
      className={`edu-band${active ? " is-active" : ""}`}
    >
      <span aria-hidden="true" className="edu-band-rule block" />

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Perspektif ditulis di elemen yang sama karena tidak ada leluhur
            ber-perspektif di sini — perspektif Tilt3D letaknya di dalam dan
            tidak menolong animasi masuk ini. */}
        <motion.div
          ref={stageRef}
          initial={false}
          animate={
            entered
              ? { opacity: 1, rotateX: 0, scale: 1 }
              : { opacity: 0, rotateX: 10, scale: 0.972 }
          }
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1400 }}
          className="edu-band-stage"
        >
          <Tilt3D
            className="edu-band-tilt"
            max={3}
            scale={1.004}
            lift={0}
            glare
            glareClassName="rounded-2xl"
            disabled={still}
          >
            <div className="edu-band-inner">
              <span aria-hidden="true" className="edu-band-ghost" style={GHOST_DEPTH}>
                {number}
              </span>

              {/* Kolom kiri: tahun dan lokasi sebagai rel penanda. Dibiarkan
                  sempit — tugasnya menunjukkan kapan, bukan menarik mata. */}
              <div className="edu-band-meta">
                <span className={`edu-period${current ? " is-current" : ""}`}>
                  {item.period}
                </span>
                <span className="edu-loc">{t(item.location)}</span>
              </div>

              <div className="edu-band-body">
                <h3 className="edu-degree" style={TITLE_DEPTH}>
                  {t(item.degree)}
                </h3>
                <p className="edu-school">{item.school}</p>

                <div className="edu-band-foot">
                  <span className="edu-detail">{t(item.detail)}</span>
                  <p className="edu-desc">{t(item.description)}</p>
                </div>
              </div>
            </div>
          </Tilt3D>
        </motion.div>
      </div>
    </article>
  );
}
