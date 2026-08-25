"use client";

import { useEffect, useState } from "react";
import { subscribeMusic, toggleMusic } from "@/lib/music";

export default function MusicPlayer({
  variant = "rail",
}: {
  variant?: "rail" | "menu";
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return subscribeMusic(setPlaying);
  }, []);

  if (variant === "menu") {
    return (
      <div className="menu-fade-in flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
          className="group flex touch-active items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white transition-colors hover:border-accent hover:text-accent"
        >
          {playing ? (
            <Equalizer className="h-4 w-4 text-accent" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
          {playing ? "Music" : "Play music"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-label={playing ? "Pause music" : "Play music"}
      aria-pressed={playing}
      title={playing ? "Pause music" : "Play music"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-xl transition-all hover:border-accent active:scale-95 ${
        playing
          ? "border-accent bg-accent/90 text-black"
          : "border-black/10 bg-white text-black hover:bg-accent hover:text-white dark:border-white/10 dark:bg-[#1C1D21] dark:text-white dark:hover:bg-accent dark:hover:text-white"
      }`}
    >
      {playing ? (
        <Equalizer className="h-4 w-4" />
      ) : (
        <PlayIcon className="h-4 w-4" />
      )}
    </button>
  );
}

function PlayIcon({ className }: { className?: string }) {  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function Equalizer({ className }: { className?: string }) {
  return (
    <span
      className={`flex items-end gap-[2px] ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="eq-bar" style={{ animationDelay: "0ms" }} />
      <span className="eq-bar" style={{ animationDelay: "160ms" }} />
      <span className="eq-bar" style={{ animationDelay: "320ms" }} />
    </span>
  );
}
