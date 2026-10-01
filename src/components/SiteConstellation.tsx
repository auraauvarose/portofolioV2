"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const NODE_COUNT = 90;

/* Kanvas titik dibuat sepanjang halaman lalu digeser lebih pelan dari scroll,
   jadi titik selalu ada di layar dan terus lewat ke bawah sepanjang halaman.
   Angka drift dibaca dari CSS supaya prefers-reduced-motion bisamati把它 dari
   satu tempat. */
const DRIFT_VAR = "--sc-drift";
const FALLBACK_DRIFT = 0.45;

/* LCG kecil: pola stabil tiap render, sama di server dan client,
   jadi tidak ada hydration mismatch. */
function noise(seed: number) {
  let s = (seed * 2654435761) % 2147483647 || 1;
  return () => ((s = (s * 48271) % 2147483647) / 2147483647);
}

export default function SiteConstellation() {
  const innerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const nodes = useMemo(() => {
    const rnd = noise(20260922);
    return Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: 3 + rnd() * 94,
      y: rnd() * 100,
      /* Setiap lima titik yang satu lebih besar: biar ada jenjang, bukan
         butiran seragam. */
      big: i % 5 === 0,
    }));
  }, []);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const readDrift = () =>
      Number(rootStyle.getPropertyValue(DRIFT_VAR)) || FALLBACK_DRIFT;

    let drift = readDrift();
    let raf = 0;
    let lastDoc = 0;

    /* Tinggi kanvas mengikuti panjang halaman supaya titik tetap|BRA Até
       dasar halaman, bukan berhenti di beberapa layar pertama.
       screens dihitung dalam JUMLAH LAYAR, jadi dikali 100 baru jadi vh. */
    const sizeCanvas = () => {
      const vh = window.innerHeight;
      const doc = document.documentElement.scrollHeight;
      if (doc === lastDoc && inner.clientHeight) return;
      lastDoc = doc;
      const screens = (doc * drift) / vh + 1.3;
      inner.style.height = `${Math.max(150, Math.ceil(screens * 100))}vh`;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sizeCanvas();
        const shifted = window.scrollY * drift;
        inner.style.transform = `translate3d(0px, ${(-shifted).toFixed(1)}px, 0px)`;
      });
    };

    const onResize = () => {
      drift = readDrift();
      lastDoc = 0;
      onScroll();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`sc-host pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-700 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      <div ref={innerRef} className="sc-inner h-[700vh] w-full will-change-transform">
        {/* Titik pakai div, bukan <circle>: viewBox yang di-stretch ke layar
            lebar membuat lingkaran jadi ellips. */}
        {nodes.map((n, i) => (
          <span
            key={i}
            className={`sc-node absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
              n.big ? "h-2 w-2" : "h-1 w-1"
            }`}
            style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
