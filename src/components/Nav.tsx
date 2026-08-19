"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers";
import { nav, profile } from "@/lib/config";

// Ordered menu → anchor mapping (matches reference header).
const ANCHORS = ["#about", "#work", "#contact"];

export default function Nav() {
  const { t, lang, setLang, theme, toggleTheme } = useLanguage();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        {/* Logo — circular avatar (initials fallback) */}
        <a href="#top" className="pointer-events-auto" aria-label="Back to top">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft font-display text-lg text-black shadow-lg transition-transform hover:scale-105 md:h-14 md:w-14 md:text-2xl">
            A
          </span>
        </a>

        {/* Menu — vertical, right-aligned, dual-layer rollover animation (desktop) */}
        <nav className="pointer-events-auto hidden flex-col items-end gap-1 md:flex">
          {nav.map((item, i) => {
            const anchor = ANCHORS[i] ?? "#";
            return (
              <a
                key={i}
                href={anchor}
                className="group relative block h-[28px] overflow-hidden md:h-[32px]"
              >
                <div className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2">
                  <span className="flex h-[28px] items-center justify-end text-[13px] font-bold uppercase tracking-[0.2em] text-muted transition-colors duration-300 md:h-[32px] md:text-[14px]">
                    {t(item)}
                  </span>
                  <span className="flex h-[28px] items-center justify-end text-[13px] font-bold uppercase tracking-[0.2em] text-accent md:h-[32px] md:text-[14px]">
                    {t(item)}
                  </span>
                </div>
              </a>
            );
          })}
        </nav>

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full text-gray-700 transition-colors hover:text-accent md:hidden dark:text-gray-200 dark:hover:text-accent"
        >
          <span className="relative block h-4 w-6" aria-hidden="true">
            <span
              className={`absolute left-0 top-0 h-[2px] w-6 bg-current transition-all duration-300 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-current transition-opacity duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 h-[2px] w-6 bg-current transition-all duration-300 ${
                open ? "bottom-1/2 translate-y-1/2 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </header>

      {/* Mobile full-screen menu overlay */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[95] flex flex-col items-center justify-center gap-2 bg-ink/95 px-6 backdrop-blur-xl transition-opacity duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {nav.map((item, i) => (
          <a
            key={i}
            href={ANCHORS[i] ?? "#"}
            onClick={() => setOpen(false)}
            className="group flex items-baseline gap-4 rounded-lg px-4 py-4 text-display text-4xl uppercase text-white transition-colors hover:text-accent"
          >
            <span className="text-xs font-bold tracking-[0.3em] text-accent">
              0{i + 1}
            </span>
            {t(item)}
          </a>
        ))}

        {/* Controls: language + theme toggle */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={() => setLang("en")}
            className={`text-sm font-bold uppercase tracking-widest transition-colors ${
              lang === "en" ? "text-accent" : "text-gray-400 hover:text-accent dark:text-gray-400"
            }`}
          >
            EN
          </button>
          <span className="h-4 w-px bg-white/20" />
          <button
            onClick={() => setLang("id")}
            className={`text-sm font-bold uppercase tracking-widest transition-colors ${
              lang === "id" ? "text-accent" : "text-gray-400 hover:text-accent dark:text-gray-400"
            }`}
          >
            ID
          </button>
          <span className="mx-1 h-4 w-px bg-white/20" />
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white transition-colors hover:border-accent hover:text-accent"
          >
            {theme === "dark" ? (
              <>
                <SunMobileIcon /> Light
              </>
            ) : (
              <>
                <MoonMobileIcon /> Dark
              </>
            )}
          </button>
        </div>

        {/* Socials */}
        <div className="mt-8 flex items-center gap-5">
          {profile.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm uppercase tracking-widest text-gray-400 transition-colors hover:text-accent"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

function SunMobileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonMobileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
