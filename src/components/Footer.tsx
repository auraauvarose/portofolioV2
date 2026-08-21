"use client";

import { useLanguage } from "@/components/providers";
import { footer, profile } from "@/lib/config";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      {/* Giant watermark name (matches reference footer) */}
      <div className="pointer-events-none select-none overflow-hidden -mt-8 md:-mt-16 lg:-mt-20">
    <h1 className="footer-mark translate-y-[25%] whitespace-nowrap text-[30vw] font-black uppercase leading-[0.75] tracking-[0.02em] text-black/[0.03] transition-colors duration-500 md:text-[17vw] lg:text-[19vw] dark:text-white/[0.02]" style={{ fontFamily: "var(--font-display)" }}>
          {profile.name.split(" ")[0]}
        </h1>
      </div>

      <div className="border-t border-white/10 px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse-dot" />
            <span>{t(footer.status)}</span>
            <span className="text-gray-700">|</span>
            <span>© {year} {profile.name.split(" ")[0].toUpperCase()}</span>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="uppercase tracking-widest transition-colors hover:text-accent"
          >
            {t(footer.backToTop)} ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
