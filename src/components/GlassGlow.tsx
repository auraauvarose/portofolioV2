"use client";

import { useEffect } from "react";

/* Kilau ikut-kursor untuk elemen .liquid-glass (lihat ::after di globals.css).
   Satu listener di `document` untuk semua panel kaca — bukan satu listener per
   elemen — supaya menambah panel kaca baru tidak menambah biaya listener.

   Posisi kursor ditulis sebagai persentase relatif terhadap kotak elemen
   (--glass-x / --glass-y), sehingga radial-gradient di CSS selalu berpusat
   di bawah kursor tanpa perlu menghitung ulang ukuran.

   Nonaktif bila:
   - perangkat tidak punya hover presisi (kaca di mobile sudah tanpa ::after),
   - pengguna meminta reduced-motion,
   - tier performa "off" (perangkat lambat / save-data). */
export default function GlassGlow() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;
    if (document.documentElement.getAttribute("data-tier") === "off") return;

    const SELECTOR = ".liquid-glass";

    const paint = (el: HTMLElement, x: number, y: number) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      el.style.setProperty("--glass-x", `${((x - r.left) / r.width) * 100}%`);
      el.style.setProperty("--glass-y", `${((y - r.top) / r.height) * 100}%`);
    };

    let raf = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTarget: HTMLElement | null = null;

    const flush = () => {
      raf = 0;
      if (lastTarget) paint(lastTarget, lastX, lastY);
    };

    const onMove = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest?.(SELECTOR) ?? null;
      if (t !== lastTarget) {
        // Saat pindah panel, panel lama kehilangan hover → opacity turun lewat
        // transisi CSS. Tidak perlu menghapus variabelnya.
        lastTarget = t as HTMLElement | null;
      }
      if (!t) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
