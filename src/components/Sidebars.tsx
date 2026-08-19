"use client";

import { useLanguage } from "@/components/providers";
import { profile } from "@/lib/config";
import { socialIcon } from "@/components/social-icons";

type Social = { label: string; href: string };

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/** Resolve a social.v2 href by label from profile config, else fallback URL. */
function hrefFor(social: Social): string {
  const found = profile.socials.find(
    (s) => s.label.toLowerCase() === social.label.toLowerCase(),
  );
  return found?.href ?? social.href;
}

const LEFT_SOCIALS: Social[] = [
  { label: "Github", href: "https://github.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Email", href: "mailto:auraauvaroseendica@gmail.com" },
  { label: "Discord", href: "https://discord.com" },
  { label: "TikTok", href: "https://tiktok.com" },
];

function leftIcon(label: string, className?: string) {
  return socialIcon(label, className);
}

export default function Sidebars() {
  const { lang, setLang, theme, toggleTheme } = useLanguage();

  return (
    <>
      {/* ---- Left rail: vertical line + socials ---- */}
      <div className="fixed left-0 top-1/2 z-40 ml-6 hidden -translate-y-1/2 md:flex lg:ml-12">
        <div className="glass flex flex-col items-center gap-6 rounded-2xl py-4 shadow-xl">
          <div className="h-14 w-[0.2px] bg-gray-400/50 dark:bg-gray-500/60" />
          {LEFT_SOCIALS.map((s) => (
            <a
              key={s.label}
              href={hrefFor(s)}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className="flex h-10 w-10 items-center justify-center text-gray-500 transition-colors hover:text-accent dark:text-gray-300 dark:hover:text-accent"
            >
              {leftIcon(s.label)}
            </a>
          ))}
          <div className="h-14 w-[0.2px] bg-gray-400/50 dark:bg-gray-500/60" />
        </div>
      </div>

      {/* ---- Right rail: vertical line + EN/ID + dark toggle ---- */}
      <div className="fixed right-0 top-1/2 z-40 mr-6 hidden -translate-y-1/2 md:flex lg:mr-12">
        <div className="glass flex flex-col items-center gap-8 rounded-2xl py-4 shadow-xl">
          <div className="h-12 w-[0.2px] bg-gray-400/50 dark:bg-gray-500/60" />
          <div className="flex flex-col items-center gap-3 text-[12px] font-bold tracking-widest dark:text-white">
            <button
              onClick={() => setLang("en")}
              className={`transition-colors ${
                lang === "en" ? "text-accent dark:text-accent" : "text-gray-500 hover:text-accent dark:text-gray-300 dark:hover:text-accent"
              }`}
            >
              EN
            </button>
            <div className="h-[1px] w-[12px] bg-gray-400/50 dark:bg-gray-500/60" />
            <button
              onClick={() => setLang("id")}
              className={`transition-colors ${
                lang === "id" ? "text-accent dark:text-accent" : "text-gray-500 hover:text-accent dark:text-gray-300 dark:hover:text-accent"
              }`}
            >
              ID
            </button>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-xl transition-all hover:bg-accent hover:text-white dark:border-white/10 dark:bg-[#1C1D21] dark:text-white dark:hover:bg-accent dark:hover:text-white"
          >
            {theme === "dark" ? <MoonIcon /> : <SunIcon />}
          </button>
          <div className="h-12 w-[0.2px] bg-gray-400/50 dark:bg-gray-500/60" />
        </div>
      </div>
    </>
  );
}
