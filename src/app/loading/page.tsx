"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markLoaded } from "@/lib/loading";

// Short greeting cycle shown on the dedicated /loading page before the curtain
// closes to reveal the home page.
const GREETINGS = ["Hello", "Hola", "Ciao", "こんにちは", "Hallo"];
const GREET_MS = 320;
const HOLD_MS = 500;
const CURTAIN_MS = 700; // curtain open & close duration (must match CSS below)

const CURTAIN_STYLE = {
  transitionProperty: "transform",
  transitionDuration: `${CURTAIN_MS}ms`,
  transitionTimingFunction: "cubic-bezier(0.76, 0, 0.24, 1)",
} as const;

type Phase = "enter" | "show" | "exit";

export default function LoadingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("enter");
  const exitedRef = useRef(false);

  // Curtain "open": slide up from below the screen to cover it right after mount.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("show"));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Greeting cycle while the curtain covers the screen.
  useEffect(() => {
    if (phase !== "show") return;
    let i = 0;
    const total = GREETINGS.length;
    const iv = setInterval(() => {
      i += 1;
      if (i < total) setIndex(i);
    }, GREET_MS);

    const go = setTimeout(() => {
      clearInterval(iv);
      setPhase("exit");
    }, GREET_MS * total + HOLD_MS);

    return () => {
      clearInterval(iv);
      clearTimeout(go);
    };
  }, [phase]);

  // Once the curtain has fully descended (off-screen), mark the first visit and
  // navigate home — home has `pf-loaded` set, so it renders its content directly.
  const finishClose = useCallback(() => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    markLoaded();
    router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const curtainTransform =
    phase === "show" ? "translateY(0)" : "translateY(100%)";

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-ink">
      {/* Curtain — slides up to open (cover the screen) and down to close (reveal home) */}
      <div
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform" && phase === "exit") {
            finishClose();
          }
        }}
        className="fixed inset-0 flex items-center justify-center bg-[#0D0E13]"
        style={{ ...CURTAIN_STYLE, transform: curtainTransform }}
      >
        {/* subtle glow */}
        <div className="pointer-events-none absolute h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[120px]" />

        <div className="relative flex flex-col items-center">
          <span
            key={GREETINGS[index]}
            className="text-display animate-preloader-word text-5xl uppercase tracking-tight text-white md:text-7xl"
          >
            {GREETINGS[index]}
            <span className="text-accent">.</span>
          </span>

          {/* progress bar */}
          <div className="mt-8 h-px w-40 overflow-hidden bg-white/15">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${((index + 1) / GREETINGS.length) * 100}%` }}
            />
          </div>

          <span className="mt-6 text-[10px] uppercase tracking-[0.4em] text-[#9ca3af]">
            Loading
          </span>
        </div>
      </div>
    </div>
  );
}
