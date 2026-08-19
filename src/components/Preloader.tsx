"use client";

import { useEffect, useState } from "react";

// "Hallo" / greeting in many languages — cycled one by one during load,
// then the overlay fades away to reveal the site.
const GREETINGS = [
  "Hello",
  "Bonjour",
  "Hola",
  "Ciao",
  "こんにちは",
  "안녕하세요",
  "你好",
  "Guten Tag",
  "Olá",
  "Sawubona",
  "مرحبا",
  "Merhaba",
  "Xin chào",
  "Namaste",
  "नमस्ते",
  "Hej",
  "Halo",
  "Hallo",
];

const GREET_MS = 420; // per-greeting duration
const HOLD_MS = 700; // hold last word before closing

export default function Preloader() {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let i = 0;
    const total = GREETINGS.length;
    const iv = setInterval(() => {
      i += 1;
      if (i < total) {
        setIndex(i);
      } else {
        clearInterval(iv);
        // hold last word, then start closing
        setTimeout(() => setDone(true), HOLD_MS);
      }
    }, GREET_MS);
    // safety: never block the page longer than this
    const safety = setTimeout(() => setDone(true), GREET_MS * total + 1500);
    return () => {
      clearInterval(iv);
      clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    // wait for the fade-out transition, then unmount
    const t = setTimeout(() => setHidden(true), 800);
    return () => clearTimeout(t);
  }, [done]);

  useEffect(() => {
    if (done) {
      // pause body scroll while preloader is shown
      document.body.style.overflow = done ? "visible" : "hidden";
    }
  }, [done]);

  if (hidden) return null;

  const word = GREETINGS[index];

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#0D0E13] transition-opacity duration-700 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[120px]" />

      <div className="relative flex flex-col items-center">
        <span
          key={word}
          className="text-display animate-preloader-word text-5xl uppercase tracking-tight text-[#ffffff] md:text-7xl"
        >
          {word}
          <span className="text-accent">.</span>
        </span>

        {/* progress bar */}
        <div className="mt-8 h-px w-40 overflow-hidden bg-[#ffffff]/15">
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
  );
}
