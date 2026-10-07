import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const EDU = readFileSync(resolve(here, "../src/components/Education.tsx"), "utf8");
const TILT = readFileSync(resolve(here, "../src/components/Tilt3D.tsx"), "utf8");
const LAYOUT = readFileSync(resolve(here, "../src/app/layout.tsx"), "utf8");
const CSS = readFileSync(resolve(here, "../src/app/globals.css"), "utf8");

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

/** Daftar rule datar dari CSS: { selector, body }. */
function parseRules(css: string): { sel: string; body: string }[] {
  const clean = stripComments(css);
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  const out: { sel: string; body: string }[] = [];
  for (const hit of clean.matchAll(pattern)) {
    out.push({ sel: hit[1].replace(/\s+/g, " ").trim(), body: hit[2] });
  }
  return out;
}

const RULES = parseRules(CSS);
const EDU_CODE = stripComments(EDU);

function ruleBody(selector: string): string | null {
  const hits = RULES.filter((r) => r.sel === selector);
  return hits.length ? hits[hits.length - 1].body : null;
}

/** Semua body untuk satu selector, termasuk varian di dalam media query.
 *  Parser di atas datar dan tidak menyimpan konteks @media, jadi selector yang
 *  sama bisa muncul lebih dari sekali. Pemeriksaan sifat harus melihat
 *  semuanya, bukan hanya kemunculan terakhir. */
function allRuleBodies(selector: string): string[] {
  return RULES.filter((r) => r.sel === selector).map((r) => r.body);
}

describe("Education — kedalaman 3D tidak dibatalkan properti grouping", () => {
  test(".edu-band-inner mempertahankan preserve-3d dan tidak memotong isinya", () => {
    const bodies = allRuleBodies(".edu-band-inner");
    assert.ok(bodies.length > 0, "rule .edu-band-inner hilang");
    assert.ok(
      bodies.some((b) => /transform-style\s*:\s*preserve-3d/.test(b)),
      ".edu-band-inner harus preserve-3d agar kedalaman anaknya dibaca",
    );
    for (const b of bodies) {
      assert.doesNotMatch(
        b,
        /overflow\s*:\s*hidden/,
        "overflow: hidden memaksa transform-style flat, sehingga kedalaman " +
          "angka dan judul hilang tanpa peringatan",
      );
      assert.doesNotMatch(
        b,
        /isolation\s*:\s*isolate/,
        "isolation: isolate termasuk grouping property yang meratakan preserve-3d",
      );
    }
  });

  test("angka latar dan judul dibaca dari --edu-depth", () => {
    for (const sel of [".edu-band-ghost", ".edu-degree"]) {
      const bodies = allRuleBodies(sel);
      assert.ok(bodies.length > 0, `rule ${sel} hilang`);
      assert.ok(
        bodies.some((b) => /translateZ\(\s*var\(--edu-depth/.test(b)),
        `${sel} harus dibaca dari --edu-depth`,
      );
    }
  });

  test("kedalaman tidak menimpa --tz milik Tilt3D", () => {
    assert.match(
      EDU_CODE,
      /--edu-depth/,
      "kedalaman pita harus punya variabel terpisah dari Tilt3D",
    );
    assert.doesNotMatch(
      EDU_CODE,
      /"--tz"/,
      "Education tidak boleh menulis --tz; variabel itu milik Tilt3D",
    );
  });

  test("Tilt3D menerima prop disabled dan memakainya", () => {
    assert.match(TILT, /disabled\?:\s*boolean/, "prop disabled tidak ada di Tilt3D");
    assert.match(
      TILT,
      /!disabled\s*&&/,
      "prop disabled tidak ikut menentukan enabledRef",
    );
  });

  test("kedalaman tetap menyala di HP dengan skala lebih kecil", () => {
    const hits = RULES.filter(
      (r) =>
        r.sel.includes(".edu-band-ghost") || r.sel.includes(".edu-degree"),
    );
    assert.ok(hits.length > 0, "rule kedalaman pita hilang");
    const mobile = hits.find((r) => /--edu-depth\s*:/.test(r.body));
    assert.ok(
      mobile,
      "HP butuh --edu-depth sendiri: nilai desktop membuat angka latar " +
        "membesar sampai keluar pita",
    );
    assert.doesNotMatch(
      hits.map((r) => r.body).join("\n"),
      /transform\s*:\s*none/,
      "kedalaman tidak boleh dimatikan total di HP — animasi masuk berbasis " +
        "scroll tetap berjalan di sana",
    );
  });
});

describe("Education — pita rebah saat masuk", () => {
  test("animasi masuk memakai rotateX dengan perspektif", () => {
    assert.match(EDU_CODE, /rotateX/, "tidak ada rotateX pada animasi masuk pita");
    assert.match(
      EDU_CODE,
      /transformPerspective/,
      "rotateX tanpa perspektif hanya memampatkan pita secara ortografis, " +
        "sehingga lipatannya tidak terbaca sebagai ruang",
    );
  });

  test("animasi masuk mati hanya saat reduced-motion, bukan di perangkat sentuh", () => {
    assert.match(
      EDU_CODE,
      /still=\{Boolean\(reduceMotion\)\}/,
      "still harus diikat ke reduceMotion saja: animasi masuk digerakkan " +
        "posisi gulir, jadi tetap bekerja di HP",
    );
    assert.doesNotMatch(
      EDU_CODE,
      /still=\{reduceMotion \|\| touch\}/,
      "mengikat still ke touch mematikan satu-satunya efek 3D yang bisa " +
        "dinikmati pengguna sentuh",
    );
    assert.match(
      EDU_CODE,
      /initial=\{false\}/,
      "animasi masuk harus mulai dari keadaan terkendali, bukan dari prop initial",
    );
  });

  test("kemiringan tidak dimatikan di perangkat sentuh", () => {
    assert.match(
      EDU_CODE,
      /disabled=\{still\}/,
      "Tilt3D hanya dimatikan saat reduced-motion",
    );
    assert.doesNotMatch(
      EDU_CODE,
      /noTilt/,
      "Tilt3D sudah punya deteksi gestur sendiri (geser mendatar memiringkan, " +
        "geser tegak menggulir), jadi mematikannya di HP membuang efek 3D",
    );
  });
});

describe("Education — tipografi tidak kaku", () => {
  test(".edu-degree memakai Bricolage Grotesque dengan sumbu opsz dibuka", () => {
    const bodies = allRuleBodies(".edu-degree");
    assert.ok(bodies.length > 0, "rule .edu-degree hilang");
    const base = bodies.find((b) => /font-family/.test(b));
    assert.ok(base, "tidak ada varian .edu-degree yang menetapkan font-family");
    assert.match(
      base,
      /var\(--font-bricolage\)/,
      "judul gelar tidak memakai Bricolage Grotesque",
    );
    assert.match(
      base,
      /font-variation-settings[^;]*"opsz"/,
      "sumbu optik harus dibuka; tanpa itu kontras tebal-tipisnya tertutup",
    );
  });

  test(".edu-school memakai Instrument Serif miring sebagai aksen", () => {
    const body = ruleBody(".edu-school");
    assert.ok(body, "rule .edu-school hilang");
    assert.match(
      body,
      /var\(--font-instrument\)/,
      "nama sekolah tidak memakai Instrument Serif",
    );
    assert.match(
      body,
      /font-style\s*:\s*italic/,
      "Instrument Serif harus miring, bukan tegak",
    );
  });

  test("font baru terdaftar di layout", () => {
    assert.match(LAYOUT, /--font-bricolage/, "variabel Bricolage tidak terdaftar");
    assert.match(LAYOUT, /--font-instrument/, "variabel Instrument tidak terdaftar");
    assert.match(
      LAYOUT,
      /BricolageGrotesque-var\.woff2/,
      "berkas Bricolage tidak dirujuk",
    );
    assert.match(
      LAYOUT,
      /InstrumentSerif-Italic\.woff2/,
      "berkas Instrument tidak dirujuk",
    );
  });

  test("utility .text-bricolage dan .text-instrument tersedia", () => {
    assert.ok(ruleBody(".text-bricolage"), "utility .text-bricolage hilang");
    assert.ok(ruleBody(".text-instrument"), "utility .text-instrument hilang");
  });
});
