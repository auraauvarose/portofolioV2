"use client";

/**
 * Shared background-music store.
 *
 * Both MusicPlayer instances (desktop rail + mobile menu) mount separate
 * buttons but must drive ONE audio element, otherwise the same track would
 * play twice. This module owns a single lazy `Audio` singleton and notifies
 * every subscriber whenever playback state changes, so all buttons stay in
 * sync.
 */

// Public path of the song (spaces URL-encoded for safety).
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
    // Drive state from the element's own events so the whole page (all
    // buttons) reflects reality.
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

/** Subscribe to playback changes; immediately calls back with current value. */
export function subscribeMusic(cb: (isPlaying: boolean) => void): () => void {
  listeners.add(cb);
  cb(playing);
  return () => {
    listeners.delete(cb);
  };
}

/** Toggle play/pause of the shared track. */
export function toggleMusic(): void {
  const a = getAudio();
  if (a.paused) {
    // Browsers require a user gesture — this runs inside a click handler.
    a.play().catch(() => {});
  } else {
    a.pause();
  }
}
