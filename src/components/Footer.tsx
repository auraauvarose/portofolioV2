"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/providers";
import { footer, profile } from "@/lib/config";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const markRef = useRef<HTMLHeadingElement>(null);

  // Pause the watermark gradient animation while it is offscreen. Nothing
  // visible changes, but the browser stops repainting a 30vw text layer
  // every frame while the user is somewhere else on the page.
  useEffect(() => {
    const el = markRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle("mark-halt", !entry?.isIntersecting),
      { rootMargin: "96px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="relative overflow-x-clip">
      <div className="pointer-events-none select-none overflow-x-clip -mt-8 md:-mt-16 lg:-mt-20">
    <h1 ref={markRef} className="footer-mark footer-mark-color translate-x-[2%] whitespace-nowrap text-[30vw] font-black uppercase leading-none tracking-[0.02em] transition-colors duration-500 md:text-[17vw] lg:text-[19vw]" style={{ fontFamily: "var(--font-array)" }}>
          {profile.name.split(" ")[0]}
        </h1>
      </div>

      <div className="border-t border-white/10 px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#22c55e] [animation:color-cycle_8s_linear_infinite,pulse-dot_2s_ease-in-out_infinite]" />
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
