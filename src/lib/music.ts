"use client";

export const MUSIC_SRC = "/Taylor%20Swift%20-%20Style.mp3";

let audio: HTMLAudioElement | null = null;
let playing = false;
const listeners = new Set<(isPlaying: boolean) => void>();

function emit() {
  listeners.forEach((l) => l(playing));
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.addEventListener("playing", () => {
      playing = true;
      emit();
    });
    audio.addEventListener("pause", () => {
      playing = false;
      emit();
    });
  }
  return audio;
}

export function subscribeMusic(cb: (isPlaying: boolean) => void): () => void {
  listeners.add(cb);
  cb(playing);
  return () => {
    listeners.delete(cb);
  };
}

export function toggleMusic(): void {
  const a = getAudio();
  if (a.paused) {
    a.play().catch(() => {});
  } else {
    a.pause();
  }
}
