import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => readFileSync(resolve(here, "..", p), "utf8");

const SC = src("src/components/SiteConstellation.tsx");
const HOME = src("src/components/HomeClient.tsx");
const CSS = src("src/app/globals.css");

const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const SC_CODE = stripComments(SC);
const CSS_CODE = stripComments(CSS);

const reducedMotionBlock = () =>
  CSS_CODE.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ??
  "";

/* Section yang pernah punya konstelasi sendiri. */
const SECTIONS = [
  "About",
  "WhatIDo",
  "Education",
  "ExperienceTimeline",
  "Certifications",
  "TechStack",
  "Showcase",
  "Testimonials",
  "Contact",
] as const;

describe("A. satu lapisan titik untuk seluruh halaman", () => {
  test("HomeClient memasang tepat satu konstelasi", () => {
    const mounts = HOME.match(/<SiteConstellation/g) ?? [];
    assert.equal(
      mounts.length,
      1,
      `harus satu konstelasi untuk seluruh halaman, ditemukan ${mounts.length}`,
    );
  });

  test("layer menempel ke viewport, tidak ikut ter-scroll", () => {
    assert.match(SC_CODE, /fixed inset-0/, "layer harus menutup layar, bukan satu section");
    assert.match(SC_CODE, /z-50/, "harus di atas konten dan di bawah Nav (z-100)");
  });

  test("layer dekoratif tidak menadah klik dan disembunyikan dari a11y", () => {
    assert.match(SC_CODE, /aria-hidden/, "layer dekoratif wajib aria-hidden");
    assert.match(SC_CODE, /pointer-events-none/, "tidak boleh menadah klik/hover");
  });

  test("tidak ada section yang punya konstelasi sendiri lagi", () => {
    for (const name of SECTIONS) {
      const code = stripComments(src(`src/components/${name}.tsx`));
      assert.doesNotMatch(
        code,
        /SiteConstellation/,
        `${name}.tsx masih punya konstelasi sendiri; harus satu untuk semua`,
      );
    }
  });
});

describe("B. garis sudah dihapus, yang tersisa titik", () => {
  test("tidak ada elemen garis sama sekali", () => {
    for (const tag of ["<svg", "<path", "<line", "<circle"]) {
      assert.doesNotMatch(SC_CODE, new RegExp(tag.replace("<", "<")), `garis ${tag} harus dihapus`);
    }
  });

  test("sisa线上garis di CSS juga dibersihkan", () => {
    assert.doesNotMatch(CSS_CODE, /--sc-link/, "custom property garis harus dihapus");
    assert.doesNotMatch(CSS_CODE, /\.sc-link/, "kelas garis harus dihapus");
    assert.doesNotMatch(CSS_CODE, /sc-drawn/, "penanda garis tergambar harus dihapus");
  });

  test("titik tetap dirender", () => {
    assert.match(SC_CODE, /nodes\.map/, "titik harus dirender dari daftar titik");
    assert.match(SC_CODE, /left: `\$\{n\.x\}%`/, "titik diposisikan dalam persen");
    assert.match(SC_CODE, /rounded-full/, "titik harus bulat");
  });

  test("titik punya jenjang ukuran, bukan butiran seragam", () => {
    assert.match(SC_CODE, /big/, "ada titik yang lebih besar dari yang lain");
    assert.match(SC_CODE, /h-2 w-2/);
    assert.match(SC_CODE, /h-1 w-1/);
  });

  test("daftar titik dihitung sekali, bukan tiap render", () => {
    assert.match(SC_CODE, /useMemo/, "harus di-memo supaya stabil dan tanpa hydration mismatch");
  });
});

describe("C. titik bergerak ke bawah sepanjang halaman", () => {
  test("kanvas digeser mengikuti scroll", () => {
    assert.match(SC_CODE, /window\.scrollY/, "harus membaca posisi scroll");
    assert.match(SC_CODE, /translate3d/, "geser pakai transform, bukan top/margin");
    assert.match(SC_CODE, /will-change-transform/, "layer geser perlu will-change");
  });

  test("tinggi kanvas mengikuti panjang halaman", () => {
    assert.match(
      SC_CODE,
      /scrollHeight/,
      "kanvas harus dihitung dari panjang halaman supaya titik ada sampai bawah",
    );
    assert.match(SC_CODE, /inner\.style\.height/, "tinggi kanvas ditulis ulang saat resize");
  });

  test("jumlah layar dikali 100 supaya jadi vh yang benar", () => {
    // screens = doc*drift/vh -> satuan layar. CSS vh = persen tinggi viewport,
    // jadi tanpa *100 kanvas jadi 100x terlalu pendek dan titik bawah hilang.
    assert.match(SC_CODE, /screens \* 100[\s)]{0,4}\}vh/, "tinggi harus screens*100vh");
  });

  test("drift dibaca dari CSS agar bisa dimatikan reduced-motion", () => {
    assert.match(SC_CODE, /getPropertyValue/, "drift harus dibaca dari --sc-drift");
    assert.match(CSS_CODE, /--sc-drift:/, "--sc-drift harus ada di globals.css");
    assert.match(reducedMotionBlock(), /--sc-drift:\s*0/, "reduce-motion harus mematikan drift");
  });

  test("scroll listener pasif, dibungkus rAF, dan dilepas", () => {
    assert.match(SC_CODE, /addEventListener\(\s*"scroll"[\s\S]{0,160}?passive:\s*true/);
    assert.match(SC_CODE, /requestAnimationFrame/, "geser per frame, bukan per event");
    assert.match(SC_CODE, /removeEventListener\(\s*"scroll"/, "listener harus dilepas");
  });
});

describe("D. titik menyala orange saat scroll", () => {
  test("--sc-node terdaftar sebagai <color>", () => {
    const block = CSS_CODE.match(/@property\s+--sc-node\s*\{[^}]*\}/)?.[0] ?? "";
    assert.ok(block, "@property --sc-node tidak terdaftar");
    assert.match(block, /syntax:\s*"<color>"/, "butuh syntax <color> agar bisa di-transition");
    assert.match(block, /inherits:\s*true/);
  });

  test("default nyaris mati di atas latar gelap", () => {
    const block = CSS_CODE.match(/@property\s+--sc-node\s*\{[\s\S]{0,200}?\}/)?.[0] ?? "";
    const alpha = block.match(/initial-value:\s*rgba\([^)]*?,\s*([\d.]+)\s*\)/)?.[1];
    assert.ok(alpha, "initial-value harus rgba dengan alpha");
    assert.ok(Number(alpha) <= 0.15, `default harus nyaris mati, dapat ${alpha}`);
  });

  test("scroll menyalakan orange", () => {
    const rule = CSS_CODE.match(/html\.is-scrolled\s*(?:,[^{]*)?\{([^}]*)\}/)?.[1] ?? "";
    assert.ok(rule, "aturan html.is-scrolled tidak ditemukan");
    assert.match(rule, /--sc-node:\s*rgba\(235,\s*89,\s*57/, `--sc-node harus accent: ${rule}`);
  });

  test("warna titik TIDAK di-transition (cegah repaint seluruh halaman)", () => {
    // --sc-node dipakai oleh 90 .sc-node; mentransisikannya berarti semuanya
    // ikut di-repaint tiap frame selama durasi transisi. Harus instan.
    const animated = CSS_CODE.match(/transition:\s*[^;}]*--sc-node[^;}]*/g) ?? [];
    assert.equal(animated.length, 0, `--sc-node tidak boleh di-transition: ${animated.join(" | ")}`);
  });

  test("penyalaan scroll dipasang listener pasif dan dilepas", () => {
    const smooth = src("src/components/SmoothScroll.tsx");
    assert.match(smooth, /addEventListener\(\s*"scroll"[\s\S]{0,120}?passive:\s*true/);
    assert.match(smooth, /removeEventListener\(\s*"scroll"/);
    assert.match(smooth, /classList\.remove\("is-scrolled"\)/);
  });

  test("titik memakai --sc-node dan denies denyut", () => {
    assert.match(CSS_CODE, /\.sc-node[\s\S]{0,120}?background-color:\s*var\(--sc-node\)/);
    assert.match(CSS_CODE, /@keyframes sc-breathe/);
    assert.match(reducedMotionBlock(), /\.sc-node/, "denyut harus dimatikan");
  });
});
