import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { nodeFractions, litMask } from "../src/lib/spine.ts";

const here = dirname(fileURLToPath(import.meta.url));
const EDU = readFileSync(resolve(here, "../src/components/Education.tsx"), "utf8");

describe("nodeFractions — posisi node sebagai fraksi panjang rail", () => {
  test("node di ujung atas = 0, tengah = 0.5, ujung bawah = 1", () => {
    assert.deepEqual(nodeFractions(0, 100, [0, 50, 100]), [0, 0.5, 1]);
  });

  test("posisi di luar rail di-clamp, bukan dibiarkan liar", () => {
    assert.deepEqual(nodeFractions(16, 535, [-100, 2000]), [0, 1]);
  });

  test("rail tanpa tinggi terukur = NaN (tidak bisa dinilai, bukan 0)", () => {
    const f = nodeFractions(0, 0, [10, 20]);
    assert.ok(f.every(Number.isNaN), "railHeight 0 harus menghasilkan NaN");
  });

  test("centre non-finite tetap NaN, tidak diam-diam jadi 0", () => {
    assert.ok(Number.isNaN(nodeFractions(0, 100, [Number.NaN])[0]));
  });
});

describe("litMask — node menyala tepat saat tepi garis mencapainya", () => {
  test("progres sama dengan fraksi sudah menyala (tepi menyentuh node)", () => {
    assert.deepEqual(litMask(0.5, [0, 0.5, 0.5001]), [true, true, false]);
  });

  test("progres nol tidak menyalakan node mana pun", () => {
    assert.deepEqual(litMask(0, [0.001, 0.5, 1]), [false, false, false]);
  });

  test("progres penuh menyalakan semua node", () => {
    assert.deepEqual(litMask(1, [0.001, 0.5, 1]), [true, true, true]);
  });

  test("monoton: node yang sudah menyala tidak pernah padam lagi", () => {
    const fracs = [0.1, 0.35, 0.62, 0.88];
    let prev = litMask(0, fracs);
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const now = litMask(p, fracs);
      now.forEach((on, i) => {
        assert.ok(
          !(prev[i] && !on),
          `node ${i} padam lagi di progres ${p.toFixed(2)}`,
        );
      });
      prev = now;
    }
  });

  test("fraksi NaN (tak terukur) tidak pernah menyala", () => {
    assert.deepEqual(litMask(1, [Number.NaN]), [false]);
  });

  test("identik dengan definisi geometris 'tepi garis melewati node'", () => {
    const railTop = 16;
    const railHeight = 535;
    const centers = [80, 361, 500, 551];
    const fracs = nodeFractions(railTop, railHeight, centers);
    for (const p of [0, 0.05, 0.12, 0.25, 0.5, 0.65, 0.75, 0.9, 0.99, 1]) {
      const edge = railTop + p * railHeight;
      const mask = litMask(p, fracs);
      centers.forEach((c, i) => {
        assert.equal(
          mask[i],
          edge >= c,
          `node ${i} (cy=${c}) di progres ${p}: tepi=${edge.toFixed(1)}`,
        );
      });
    }
  });
});

describe("Education.tsx memakai progres garis sebagai satu-satunya sumber", () => {
  test("node tidak lagi menyala paksa lewat index < 1", () => {
    assert.doesNotMatch(
      EDU,
      /index\s*<\s*1/,
      "node pertama masih dinyalakan paksa (index < 1) tanpa melihat garis",
    );
  });

  test("class is-done tidak lagi bergantung pada active/index", () => {
    assert.doesNotMatch(
      EDU,
      /active\s*\|\|/,
      "is-done masih memakai 'active || ...' alih-alih progres garis",
    );
  });

  test("is-done dibaca dari nilai lit per node (hasil ukur garis)", () => {
    const nodeClass = EDU.match(/className=\{`edu-node[\s\S]*?`\}/);
    assert.ok(nodeClass, "markup .edu-node tidak ditemukan di Education.tsx");
    assert.match(
      nodeClass[0],
      /\$\{\s*lit\s*\?\s*"is-done"\s*:\s*""\s*\}/,
      "is-done tidak dibaca dari nilai lit (harus dari progres garis)",
    );
  });

  test("fraksi node diukur dari geometri rail (offsetTop/offsetHeight)", () => {
    assert.match(EDU, /nodeFractions\s*\(/, "nodeFractions tidak dipakai");
    assert.match(EDU, /offsetTop/, "posisi node tidak diukur dari offsetTop");
    assert.match(EDU, /offsetHeight/, "panjang rail tidak diukur dari offsetHeight");
  });

  test("state lit mengikuti nilai progres spine yang sama dengan fill", () => {
    assert.match(
      EDU,
      /(spineProgress\.on\(|useMotionValueEvent\(\s*spineProgress)/,
      "state node tidak disinkronkan ke spineProgress (fill)",
    );
    assert.match(EDU, /litMask\s*\(/, "litMask tidak dipakai");
  });
});
