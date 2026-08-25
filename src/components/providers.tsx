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
  const themePanels = useRef<HTMLDivElement[] | null>(null);

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

  useEffect(
    () => () => {
      if (themePanels.current) {
        themePanels.current.forEach((p) => p.remove());
        themePanels.current = null;
      }
    },
    [],
  );

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    if (next === "light") {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    }
    window.localStorage.setItem("theme", next);
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
    const root = document.documentElement;
    const next: Theme = root.classList.contains("dark") ? "light" : "dark";

    const apply = () => {
      applyTheme(next);
      setTheme(next);
    };

    // Reduced motion → skip animation, swap directly
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }

    // Window-opening overlay: two panels split top/bottom.
    // Only composited transforms → zero layout thrash, no lag.
    if (themePanels.current) {
      themePanels.current.forEach((p) => p.remove());
      themePanels.current = null;
    }

    // Determine ink color from the current theme (no getComputedStyle → no forced recalc)
    const ink = root.classList.contains("dark") ? "#0d0e13" : "#f4f4f5";

    const mk = (cls: string) => {
      const p = document.createElement("div");
      p.className = `theme-panel ${cls}`;
      p.style.backgroundColor = ink;
      document.body.appendChild(p);
      return p;
    };

    const top = mk("theme-panel-top");
    const bottom = mk("theme-panel-bottom");
    themePanels.current = [top, bottom];

    const ease = "cubic-bezier(0.76, 0, 0.24, 1)";
    top.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-101%)" }],
      { duration: 550, easing: ease, fill: "forwards" },
    );
    bottom.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(101%)" }],
      { duration: 550, easing: ease, fill: "forwards" },
    );

    // Swap theme behind the panels — deferred to the next frame so the
    // panel animation starts before the class swap triggers style recalc.
    requestAnimationFrame(() => {
      apply();
    });

    window.setTimeout(() => {
      if (themePanels.current) {
        themePanels.current.forEach((p) => p.remove());
        themePanels.current = null;
      }
    }, 600);
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
