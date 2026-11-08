import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = source("src/app/globals.css");

test("pola titik body dan TechStack diganti kontur, warna dasar tetap", () => {
  const body = css.match(/(?:^|\n)body\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(body, /background-color:\s*var\(--color-ink\)/);
  assert.doesNotMatch(body, /radial-gradient|background-size/);
  assert.doesNotMatch(css, /\.sc-node|\.sc-inner|sc-breathe/);
  assert.match(source("src/components/TechStack.tsx"), /\.ts-bg\s*\{\s*background-image:\s*none/);
});

test("kontur netral menyesuaikan tema tanpa menutupi teks atau klik", () => {
  assert.match(css, /\.sc-host\s*\{[^}]*color:\s*rgba\(127, 127, 127, 0\.28\)/);
  assert.match(css, /\.dark \.sc-host\s*\{[^}]*color:\s*rgba\(185, 185, 185, 0\.24\)/);
  assert.match(css, /mix-blend-mode:\s*multiply/);
  assert.match(css, /mix-blend-mode:\s*screen/);
  assert.match(source("src/components/SiteConstellation.tsx"), /pointer-events-none/);
});

test("gambar Hero dan struktur section tidak berubah", () => {
  const hero = source("src/components/Hero.tsx");
  assert.match(hero, /url\(\/photo\/dakmode-bg\.webp\)/);
  assert.match(hero, /url\(\/photo\/lightmode-bg\.webp\)/);
  const home = source("src/components/HomeClient.tsx");
  assert.match(home, /<Hero \/>/);
  assert.match(home, /<About \/>/);
  assert.match(home, /<Footer \/>/);
});