import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { DEFAULT_SITE_URL } from "../src/lib/site.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const HOME = stripComments(src("src/components/HomeClient.tsx"));
const SITE = stripComments(src("src/lib/site.ts"));

describe("A. beranda dirender ke HTML sejak awal", () => {
  test("tidak ada early return yang menyembunyikan seluruh halaman saat 'enter'", () => {
    assert.doesNotMatch(
      HOME,
      /if\s*\(\s*phase === "enter"\s*\)/,
      "early return saat phase 'enter' kembali — HTML beranda akan kosong lagi",
    );
  });

  test("SmoothScroll merender pohon halaman tanpa syarat", () => {
    assert.match(HOME, /<SmoothScroll>/, "SmoothScroll tidak dirender");
    const beforeTree = HOME.split("<SmoothScroll>")[0];
    assert.doesNotMatch(
      beforeTree,
      /return\s*</,
      "masih ada early return JSX sebelum pohon halaman dirender",
    );
  });

  for (const component of [
    "Hero",
    "About",
    "WhatIDo",
    "Education",
    "ExperienceTimeline",
    "Certifications",
    "TechStack",
    "Showcase",
    "Testimonials",
    "Contact",
    "Footer",
  ]) {
    test(`${component} ada di pohon halaman`, () => {
      assert.match(HOME, new RegExp(`<${component}[\\s/>]`));
    });
  }
});

describe("B. H1 ada di markup Hero", () => {
  test("Hero merender <h1>", () => {
    assert.match(src("src/components/Hero.tsx"), /<h1\b/, "H1 Hero hilang");
  });
});

describe("C. animasi curtain tetap utuh", () => {
  test("cover hitam tetap menutupi fase 'enter'", () => {
    assert.match(
      HOME,
      /phase === "enter"[\s\S]{0,160}?fixed inset-0 z-\[99999\]/,
      "cover fase 'enter' hilang — hero akan berkedip sebelum curtain tampil",
    );
  });

  test("LoadingCurtain masih ada dengan overlay penuh + slide-down exit", () => {
    assert.match(HOME, /function LoadingCurtain\b/, "LoadingCurtain hilang");
    assert.match(HOME, /exit=\{\{\s*y:\s*"100%"\s*\}\}/, "slide-down exit hilang");
    assert.match(HOME, /GREETINGS\s*=\s*\[/, "siklus greeting hilang");
  });

  test("AnimatePresence masih menggerakkan curtain lewat phase 'show'", () => {
    assert.match(HOME, /<AnimatePresence>/);
    assert.match(HOME, /phase === "show" && <LoadingCurtain/);
  });
});

describe("D. canonical menunjuk ke domain sendiri", () => {
  test("DEFAULT_SITE_URL adalah domain publik, bukan workers.dev", () => {
    assert.equal(DEFAULT_SITE_URL, "https://auraauvarose.my.id");
  });

  test("tidak ada sisa alamat workers.dev di site.ts", () => {
    assert.doesNotMatch(SITE, /workers\.dev/, "fallback workers.dev masih tertinggal");
  });

  test("urutan sumber URL dipertahankan (env menang atas fallback)", () => {
    assert.match(
      SITE,
      /NEXT_PUBLIC_SITE_URL\s*\|\|[\s\S]{0,80}?DEFAULT_SITE_URL/,
      "resolusi siteUrl() berubah",
    );
  });

  test("robots & sitemap diturunkan dari helper, bukan host hardcoded", () => {
    for (const f of ["src/app/robots.ts", "src/app/sitemap.ts"]) {
      const code = src(f);
      assert.doesNotMatch(code, /https?:\/\/[a-z0-9.-]+\.(my\.id|workers\.dev)/i, `${f} memuat host hardcoded`);
      assert.match(code, /absoluteUrl|siteUrl/, `${f} tidak memakai helper URL`);
    }
  });
});
