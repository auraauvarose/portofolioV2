// Shared flag for the "loading only once, ever" gate.
// Stored in localStorage (persistent across sessions/tabs) so the /loading
// curtain shows only on a visitor's very first visit to this browser; after
// that, home renders directly.
export const LOADED_KEY = "pf-loaded-v2";

export function markLoaded(): void {
  try {
    localStorage.setItem(LOADED_KEY, "1");
  } catch {
    /* ignore privacy-mode storage errors */
  }
}

export function isLoaded(): boolean {
  try {
    return localStorage.getItem(LOADED_KEY) === "1";
  } catch {
    return false;
  }
}
