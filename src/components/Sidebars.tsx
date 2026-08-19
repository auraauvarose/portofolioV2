"use client";

import { useLanguage } from "@/components/providers";
import { profile } from "@/lib/config";

type Social = { label: string; href: string };

// Icon components (stroke style, matching the reference site's icons).
function GithubIcon({ className }: { className?: string }) {
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
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 4-2.64-3.5-5.36-4.5-8-4 0 0-1 0-3 1.5 0 1.15 0 2.35 0 3.5A5.403 5.403 0 0 0 4 9.5c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
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
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

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
  if (label.toLowerCase().includes("github")) return <GithubIcon className={className} />;
  if (label.toLowerCase().includes("instagram")) return <InstagramIcon className={className} />;
  if (label.toLowerCase().includes("email")) return <EmailIcon className={className} />;
  if (label.toLowerCase().includes("discord")) return <DiscordIcon className={className} />;
  return <TikTokIcon className={className} />;
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
