"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { Lang, Localized } from "@/types";

type Theme = "dark" | "light";

type AppContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (value: Localized | { en: string; id: string } | undefined | null) => string;
  theme: Theme;
  toggleTheme: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("dark");
  // Reused to clear the theme-transition window timer on unmount + retoggle.
  const themeTimer = useRef<number | null>(null);

  // Restore language + theme from localStorage, and apply theme class to <html>.
  useEffect(() => {
    const storedLang = window.localStorage.getItem("lang");
    if (storedLang === "en" || storedLang === "id") setLangState(storedLang);

    const storedTheme = window.localStorage.getItem("theme");
    const initial: Theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : "dark";
    setTheme(initial);
    applyTheme(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up the theme-transition timer on unmount.
  useEffect(
    () => () => {
      if (themeTimer.current) window.clearTimeout(themeTimer.current);
    },
    [],
  );

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    // Brief transition window so colors crossfade smoothly on theme switch.
    root.classList.add("theme-anim");
    if (next === "light") {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    }
    window.localStorage.setItem("theme", next);
    if (themeTimer.current) window.clearTimeout(themeTimer.current);
    themeTimer.current = window.setTimeout(
      () => root.classList.remove("theme-anim"),
      500,
    );
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem("lang", next);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "en" ? "id" : "en";
      window.localStorage.setItem("lang", next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  const t = useCallback(
    (value: Localized | { en: string; id: string } | undefined | null) => {
      if (!value) return "";
      return value[lang] ?? value.en ?? "";
    },
    [lang],
  );

  return (
    <AppContext.Provider
      value={{ lang, setLang, toggle, t, theme, toggleTheme }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
