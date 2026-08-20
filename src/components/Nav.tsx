"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers";
import { nav, profile } from "@/lib/config";
import { socialIcon } from "@/components/social-icons";
import MusicPlayer from "@/components/MusicPlayer";

// Ordered menu → anchor mapping (matches reference header).
const ANCHORS = ["#about", "#work", "#contact"];

const PROFILE_IMG = "/profile.png";

export default function Nav() {
  const { t, lang, setLang, theme, toggleTheme } = useLanguage();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close the mobile menu / profile popup on Escape.
  useEffect(() => {
    if (!open && !profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, profileOpen]);

  // Lock body scroll while the mobile menu or profile popup is open.
  useEffect(() => {
    document.body.style.overflow = open || profileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, profileOpen]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        {/* Logo — round profile photo, clickable to view a larger popup */}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="View profile photo"
          className="pointer-events-auto group relative h-10 w-10 overflow-hidden rounded-full border border-white/15 bg-ink shadow-lg transition-transform hover:scale-105 md:h-14 md:w-14"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PROFILE_IMG}
            alt={profile.name}
            className="h-full w-full object-cover object-center"
          />
        </button>

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
            className={`menu-link group flex items-baseline gap-4 rounded-lg px-4 py-4 text-display text-4xl uppercase text-white transition-colors hover:text-accent active:text-accent ${
              open ? "menu-item-in touch-active" : ""
            }`}
            style={open ? { animationDelay: `${i * 70 + 80}ms` } : undefined}
          >
            <span className="text-xs font-bold tracking-[0.3em] text-accent">
              0{i + 1}
            </span>
            {t(item)}
          </a>
        ))}

        {/* Controls: language + theme toggle */}
        <div className="menu-fade-in mt-10 flex items-center gap-4" style={open ? { animationDelay: `${nav.length * 70 + 160}ms` } : undefined}>
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

        {/* Socials — icon-only logos */}
        <div className="menu-fade-in mt-8 flex items-center gap-5" style={open ? { animationDelay: `${nav.length * 70 + 240}ms` } : undefined}>
          {profile.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              title={s.label}
              className="flex h-11 w-11 touch-active items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-all duration-200 hover:scale-110 hover:border-accent hover:text-accent active:scale-95 dark:text-gray-200"
            >
              {socialIcon(s.label)}
            </a>
          ))}
        </div>

        {/* Music player — pinned at the very bottom of the mobile menu */}
        <div className="mt-10 mb-2">
          <MusicPlayer variant="menu" />
        </div>
      </div>

      {/* Profile photo popup */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-6"
          onClick={() => setProfileOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo"
        >
          <button
            type="button"
            onClick={() => setProfileOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:right-6 sm:top-6"
          >
            ✕
          </button>
          {/* Square frame — image cropped to a neat square (matching the round
              avatar crop) and enlarged so it reads as a big framed picture. */}
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid aspect-square w-full place-items-center overflow-hidden bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PROFILE_IMG}
                alt={profile.name}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="border-t border-white/10 px-5 py-3 text-center">
              <p className="text-sm font-semibold text-white">{profile.name}</p>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {profile.name.split(" ")[1] ?? "Developer"}
              </p>
            </div>
          </div>
        </div>
      )}
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
