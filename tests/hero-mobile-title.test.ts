import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const HERO = readFileSync(resolve(here, "../src/components/Hero.tsx"), "utf8");
const CSS = readFileSync(resolve(here, "../src/app/globals.css"), "utf8");

const heading = HERO.match(/<h1 className="([^"]*hero-title-3d__heading[^"]*)"/);
const stage = HERO.match(/<div className="(hero-title-3d__stage[^"]*)"/);
const depth = HERO.match(/className="(hero-title-3d__depth[^"]*)"/);
const tilt = HERO.match(/className="(hero-title-3d relative[^"]*)"/);
const mobileBlock = HERO.match(/<span className="(flex w-full flex-col[^"]*)">([\s\S]*?)<\/span>\s*<div className="hidden grid-cols-2/);
const desktopBlock = HERO.match(/<div className="(hidden grid-cols-2[^"]*)">([\s\S]*?)<\/div>\s*<\/h1>/);

describe("Hero HP — FULLSTACK rata kiri, DEVELOPER rata kanan, desktop utuh", () => {
  test("markup heading/stage/depth/tilt masih ada", () => {
    assert.ok(heading, "h1.hero-title-3d__heading hilang dari Hero.tsx");
    assert.ok(stage, "div.hero-title-3d__stage hilang");
    assert.ok(depth, "div.hero-title-3d__depth hilang");
    assert.ok(tilt, "div.hero-title-3d hilang");
  });

  test("blok judul melebar penuh di HP saja", () => {
    assert.match(stage![1], /(?:^|\s)max-md:w-full(?:\s|$)/, "stage butuh max-md:w-full");
    assert.match(tilt![1], /(?:^|\s)max-md:self-stretch(?:\s|$)/, "hero-title-3d butuh max-md:self-stretch");
  });

  test("h1 tetap filled putih bracket-form (kontrak hero-headline-color)", () => {
    assert.match(heading![1], /(?:^|\s)text-\[#ffffff\]\/90(?:\s|$)/);
    assert.match(heading![1], /(?:^|\s)dark:text-\[#ffffff\]\/90(?:\s|$)/);
    assert.ok(!/text-white\//.test(heading![1]), "jangan pakai text-white/ — pakai bracket-form");
  });

  test("HP: satu kata per baris, FULLSTACK kiri lalu DEVELOPER di ujung kanan", () => {
    assert.ok(mobileBlock, "blok mobile (span flex w-full flex-col … + div hidden grid-cols-2) tidak ketemu");
    assert.match(mobileBlock![1], /(?:^|\s)md:hidden(?:\s|$)/, "blok mobile harus md:hidden");
    assert.match(mobileBlock![2], /\{title1\}<\/span>\s*<span className="self-end">\{title2\}/,
      "urutan harus title1 (kiri) lalu title2 (self-end/kanan)");
    assert.match(mobileBlock![1], /items-start/, "baris pertama harus rata kiri");
  });

  test("desktop: dua kolom mengapit siluet, kiri rata kanan & kanan rata kiri", () => {
    assert.ok(desktopBlock, "blok desktop (div hidden grid-cols-2 …) tidak ketemu");
    assert.match(desktopBlock![1], /(?:^|\s)md:grid(?:\s|$)/, "blok desktop harus md:grid");
    assert.ok(!/md:hidden/.test(desktopBlock![1]));
    assert.match(desktopBlock![2], /className="text-right"[\s\S]*?\{title1L\}[\s\S]*?\{title2L\}/);
    assert.match(desktopBlock![2], /className="text-left"[\s\S]*?\{title1R\}[\s\S]*?\{title2R\}/);
  });

  test("gap desktop 24vw (36vw dark) masih dipakai di depth", () => {
    assert.ok(HERO.includes("md:gap-[24vw] dark:md:gap-[36vw]"), "kelas gap desktop hilang");
  });

  test("depth tidak ditambah kelas display — CSS @media 767px yang menyembunyikannya", () => {
    assert.ok(!/(?:^|\s)hidden(?:\s|$)/.test(depth![1]), "jangan tambah hidden pada depth");
    assert.match(CSS, /@media[^{]*max-width:\s*767px[\s\S]{0,400}?\.hero-title-3d__depth\s*\{[^}]*display:\s*none/);
  });

  test("font & letter-spacing mobile + transform flat masih diatur CSS", () => {
    assert.match(CSS, /@media[^{]*max-width:\s*639px[\s\S]{0,300}?\.hero-title-3d__heading\s*\{[^}]*font-family:\s*var\(--font-bevellier\)/);
    assert.match(CSS, /@media[^{]*max-width:\s*767px[\s\S]{0,900}?\.hero-title-3d__heading\s*\{[^}]*transform:\s*none/);
  });

  test("lapisan dalam lensa tidak ikut berubah — tetap 2 kolom + gap 24vw", () => {
    assert.ok(
      (HERO.match(/grid-cols-2 gap-0 md:gap-\[24vw\]/g) ?? []).length >= 2,
      "depth & lensa harus tetap grid-cols-2 gap 24vw",
    );
  });
});
