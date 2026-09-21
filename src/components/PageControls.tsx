"use client";

import type { ReactElement } from "react";
import { useLanguage } from "@/components/providers";
import MusicPlayer from "@/components/MusicPlayer";
import { pageControls } from "@/lib/config";
import { THEME_CHOICES, type Theme } from "@/lib/theme";

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

const THEME_META: Record<
  Theme,
  { label: "themeDark" | "themeLight"; icon: () => ReactElement }
> = {
  dark: { label: "themeDark", icon: MoonIcon },
  light: { label: "themeLight", icon: SunIcon },
};

/**
 * Menu kontrol halaman: pilihan tema + musik.
 *
 * Penempatan sengaja SATU aturan untuk semua ukuran layar — fixed menempel di
 * atas, di-center horizontal. Tidak ada cabang `md:` yang memindahkan atau
 * menyembunyikannya, jadi tampilan mobile identik dengan desktop.
 */
export default function PageControls() {
  const { theme, setTheme, t } = useLanguage();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1 shadow-xl">
        <span className="sr-only">{t(pageControls.themeLabel)}</span>

        {THEME_CHOICES.map((choice) => {
          const active = theme === choice;
          const Icon = THEME_META[choice].icon;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => setTheme(choice)}
              aria-label={t(pageControls[THEME_META[choice].label])}
              aria-pressed={active}
              title={t(pageControls[THEME_META[choice].label])}
              className={`flex touch-active items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                active
                  ? "bg-accent text-black"
                  : "text-white hover:text-accent"
              }`}
            >
              <Icon />
              {t(pageControls[THEME_META[choice].label])}
            </button>
          );
        })}

        <span className="mx-1 h-4 w-px bg-white/15" aria-hidden="true" />

        <MusicPlayer variant="bar" />
      </div>
    </div>
  );
}
