import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => readFileSync(resolve(here, "..", p), "utf8");

const TECH = src("src/components/TechStack.tsx");
const CONFIG = src("src/lib/config.ts");

const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const CODE = stripComments(TECH);

/* Isolasi blok CSS lokal komponen: dari .ts-bg sampai penutup terakhir. */
function cssBlock(selector: string): string | null {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Aturan CSS di template literal selalu dimulai di awal baris.
  const re = new RegExp(`(?:^|[}\\n])\\s*${esc}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(CODE))) out.push(m[1]);
  return out.length ? out.join("\n") : null;
}

describe("G. background bebas orange", () => {
  test("gradient background tidak memuat warna accent", () => {
    const bg = cssBlock(".ts-bg");
    assert.ok(bg, "blok .ts-bg tidak ditemukan");
    assert.doesNotMatch(
      bg,
      /235\s*,\s*89\s*,\s*57/i,
      `.ts-bg masih memakai rgb(235,89,57) = warna accent: ${bg}`,
    );
  });

  test("node konstelasi tidak memakai text-accent", () => {
    const circle = CODE.match(/<circle[\s\S]*?\/>/g) ?? [];
    assert.ok(circle.length > 0, "node konstelasi tidak ditemukan");
    for (const node of circle) {
      assert.doesNotMatch(
        node,
        /text-accent/,
        `node konstelasi masih orange: ${node}`,
      );
    }
  });
});

describe("H. garis hover mengikuti lengkung kartu", () => {
  test("pseudo-element kartu memakai border-radius: inherit", () => {
    const before = cssBlock(".ts-card::before");
    assert.ok(before, "pseudo .ts-card::before tidak ditemukan");
    assert.match(
      before,
      /border-radius:\s*inherit/,
      "garis hover harus mewarisi radius kartu, kalau tidak jadi garis lurus",
    );
  });

  test("pseudo ::after (ring glow) juga mewarisi radius", () => {
    const after = cssBlock(".ts-card::after");
    assert.ok(after, "pseudo .ts-card::after tidak ditemukan");
    assert.match(after, /border-radius:\s*inherit/);
  });

  test("corner bracket bersiku sudah dihapus total", () => {
    assert.doesNotMatch(
      CODE,
      /border-top-left-radius:\s*6px/,
      "corner bracket bersiku masih ada — inilah garis lurus yang tidak ikut melengkung",
    );
  });
});

describe("I. efek 3D memakai Tilt3D yang sudah ada di repo", () => {
  test("mengimpor komponen Tilt3D, bukan implementasi 3D baru", () => {
    assert.match(
      CODE,
      /import Tilt3D from "@\/components\/Tilt3D"/,
      "efek 3D harus pakai Tilt3D yang sudah dipakai section lain",
    );
  });

  test("Tilt3D tidak dobel mengimplementasi tilt sendiri", () => {
    assert.doesNotMatch(
      CODE,
      /requestAnimationFrame/,
      "Tilt3D sudah menangani RAF; jangan tulis ulang di sini",
    );
  });

  test("kartu dibungkus Tilt3D dengan lift + glare", () => {
    const tilt = CODE.match(/<Tilt3D[\s\S]*?>/g) ?? [];
    assert.ok(tilt.length > 0, "tidak ada <Tilt3D> di TechStack");
    const props = tilt.join("\n");
    assert.match(props, /lift=\{?\d+/, "3D perlu lift (translateZ) agar terasa-depth");
    assert.match(props, /glare/, "glare memberi kesan kedalaman saat hover");
  });
});

describe("J. bar aksen kiri baris skill ikut melengkung", () => {
  test("bar aksen memakai radius kapsul, bukan sudut tajam", () => {
    const bar = cssBlock(".ts-row::before");
    assert.ok(bar, "pseudo .ts-row::before tidak ditemukan");
    assert.match(
      bar,
      /border-radius:\s*999px/,
      `bar aksen harus melengkung penuh (999px), bukan radius kecil: ${bar}`,
    );
  });

  test("radius lama yang menyisakan ujung lurus sudah dihapus", () => {
    assert.doesNotMatch(
      CODE,
      /border-radius:\s*2px/,
      "radius 2px pada bar 2px-wide membuat ujungnya hampir lurus",
    );
  });

  test("bar tidak keluar dari lengkung baris (inset vertikal >= 2px)", () => {
    const bar = cssBlock(".ts-row::before") ?? "";
    const top = bar.match(/top:\s*(\d+)px/);
    const bottom = bar.match(/bottom:\s*(\d+)px/);
    assert.ok(top && bottom, "bar harus punya top & bottom eksplisit");
    assert.ok(
      Number(top[1]) >= 2 && Number(bottom[1]) >= 2,
      `inset vertikal bar ${top[1]}px/${bottom[1]}px membuat ujung bar menonjol dari radius baris`,
    );
  });

  test("bar tetap punya scaleY agar muncul saat hover", () => {
    const hover = CODE.match(/\.ts-row:hover::before[\s\S]{0,120}/)?.[0] ?? "";
    assert.match(
      hover,
      /scaleY\(1\)/,
      "bar harus tetap muncul lewat scaleY(1) saat hover",
    );
  });

  test("elemen .ts-row harus relative — kalau tidak, bar ngumpet ke kartu", () => {
    const li = CODE.match(/<li className="[^"]*ts-row[^"]*"/)?.[0];
    assert.ok(li, "elemen <li class=\"ts-row …\"> tidak ditemukan");
    assert.match(
      li,
      /\brelative\b/,
      `bar .ts-row::before itu position:absolute; tanpa "relative" di .ts-row ia diposisikan terhadap .ts-card dan muncul melintasi border kartu: ${li}`,
    );
  });
});

describe("A. B8 — section TechStack tidak boleh hilang di tablet landscape", () => {
  test("tidak ada cabang JS yangmemutuskan render berdasarkan pointer coarse", () => {
    assert.doesNotMatch(
      CODE,
      /pointer:\s*coarse/,
      "TechStack masih bercabang di JS berdasarkan pointer:coarse — inilah akar bug B8",
    );
  });

  test("tidak ada md:hidden yang menyembunyikan section di lebar >=768px", () => {
    assert.doesNotMatch(
      CODE,
      /md:hidden/,
      "TechStack masih memakai md:hidden — di tablet landscape section ikut hilang",
    );
  });

  test("hanya ada satu komponen render, tanpa cabang mobile/desktop", () => {
    assert.doesNotMatch(
      CODE,
      /TechStackMobile|TechStackMindMap/,
      "masih ada dua cabang komponen; Johannes hanya boleh satu yang responsif",
    );
  });
});

describe("B. konten selalu terbaca tanpa interaksi", () => {
  test("deskripsi item dirender langsung, bukan hanya saat hover", () => {
    assert.match(
      CODE,
      /t\(description\)/,
      "deskripsi teknologi harus masuk ke markup, bukan hover-only",
    );
  });

  test("deskripsi dibatasi 2 baris supaya kartu tidak melar", () => {
    assert.match(
      CODE,
      /line-clamp-2/,
      "deskripsi perlu clamp 2 baris",
    );
  });

  test("tombol filter kategori punya aria-pressed", () => {
    const pressed = CODE.match(/aria-pressed=\{solo[^}]*\}/g) ?? [];
    assert.ok(
      pressed.length >= 2,
      "tombol filter harus menyorotkan state via aria-pressed",
    );
  });
});

describe("C. item tanpa link tidak jadi <a> palsu", () => {
  test("link eksternal hanya dirender bila techLinks punya entri", () => {
    assert.match(
      CODE,
      /const link = techLinks\[label\]/,
      "link harus diambil dari techLinks per item",
    );
    assert.match(
      CODE,
      /rel="noreferrer"/,
      "link eksternal wajib rel=noreferrer",
    );
  });
});

describe("D. animasi dihormati", () => {
  test("ada penanganan prefers-reduced-motion", () => {
    assert.match(
      CODE,
      /prefers-reduced-motion/,
      "animasi harus dinonaktifkan saat user minta reduced motion",
    );
  });

  test(" IntersectionObserver menghentikan animasi di luar viewport", () => {
    assert.match(
      CODE,
      /IntersectionObserver/,
      "animasi background harus berhenti saat section tak terlihat",
    );
  });
});

describe("E. layer konstelasi dekoratif", () => {
  test("SVG konstelasi dirender sebagai latar", () => {
    assert.match(CODE, /<svg/, "layer konstelasi dekoratif harus ada");
    assert.match(CODE, /aria-hidden/, "SVG dekoratif wajib aria-hidden");
    assert.match(
      CODE,
      /pointer-events-none/,
      "layer dekoratif tidak boleh menadah klik/hover pengguna",
    );
  });

  test("node dan edge konstelasi dirender dari data yang sama", () => {
    assert.match(CODE, /NODES\.map/, "node konstelasi harus dirender dari NODES");
    assert.match(CODE, /EDGES\.map/, "edge konstelasi harus dirender dari EDGES");
  });
});

describe("F. data tetap dari sumber yang sama", () => {
  test("kategori tetap dibaca dari useSiteContent, bukan hard-code", () => {
    assert.match(
      CODE,
      /useSiteContent\(\)/,
      "kategori harus dari useSiteContent agar override dashboard tetap berlaku",
    );
  });

  test("techDescriptions & techLinks tetap dari lib/config", () => {
    assert.match(CODE, /techDescriptions/);
    assert.match(CODE, /techLinks/);
    assert.match(CONFIG, /export const techDescriptions/);
    assert.match(CONFIG, /export const techLinks/);
  });
});
