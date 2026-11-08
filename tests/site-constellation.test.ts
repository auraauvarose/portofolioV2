import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sampleTopography } from "../src/components/SiteConstellation";

const source = readFileSync(new URL("../src/components/SiteConstellation.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/components/HomeClient.tsx", import.meta.url), "utf8");
const flat = { x: 0, y: 0, lift: 0 };

test("kontur stabil, kontinu, dan berubah terhadap waktu", () => {
  assert.equal(typeof sampleTopography, "function", "medan kontur belum tersedia");
  const value = sampleTopography(117, 231, 0.3, flat);
  assert.equal(sampleTopography(117, 231, 0.3, flat), value);
  assert.ok(Math.abs(sampleTopography(117.01, 231, 0.3, flat) - value) < 0.001);
  assert.notEqual(sampleTopography(117, 231, 0.4, flat), value);
  for (let y = 0; y <= 1080; y += 90) {
    for (let x = 0; x <= 1920; x += 90) {
      assert.ok(Number.isFinite(sampleTopography(x, y, 0.3, flat)));
    }
  }
});

test("bukit mengikuti kursor, bukan menggeser seluruh gambar", () => {
  assert.equal(typeof sampleTopography, "function", "respons kursor belum tersedia");
  const base = sampleTopography(300, 200, 0, flat);
  const near = sampleTopography(300, 200, 0, { x: 300, y: 200, lift: 1 });
  const far = sampleTopography(300, 200, 0, { x: 1200, y: 200, lift: 1 });
  assert.ok(Math.abs(near - base - 1.275) < 1e-10);
  assert.ok(Math.abs(far - base) < 0.001);
});

test("satu canvas seluruh halaman, dekoratif, tanpa titik lama", () => {
  assert.equal((home.match(/<SiteConstellation/g) ?? []).length, 1);
  assert.match(source, /<canvas/);
  assert.match(source, /fixed inset-0 z-50/);
  assert.match(source, /pointer-events-none/);
  assert.match(source, /aria-hidden="true"/);
  assert.doesNotMatch(source, /nodes\.map|sc-node|sc-inner/);
  assert.match(source, /new Path2D/);
});

test("gerak halus: spring, tanpa pembatasan 30fps", () => {
  assert.match(source, /requestAnimationFrame\(frame\)/, "frame harus jalan tiap refresh");
  assert.doesNotMatch(source, /1000 \/ 30/, "pembatasan 30fps membuat gerak tersendat");
  assert.match(source, /damping/, "bukit harus memakai spring teredam, bukan lerp kaku");
  assert.match(source, /velocity|vel\b/, "spring butuh kecepatan agar tidak menyentak");
});

test("kontur berhenti di touch, reduced-motion, dan tab tersembunyi", () => {
  assert.match(source, /fine\.matches && !reduced\.matches && !document\.hidden/);
  assert.match(source, /event\.pointerType === "touch"/);
  assert.match(source, /cancelAnimationFrame\(raf\)/);
  assert.match(source, /sizeObserver\.disconnect\(\)/);
  assert.match(source, /themeObserver\.disconnect\(\)/);
  assert.match(source, /removeEventListener\("pointermove", move\)/);
  assert.match(source, /removeEventListener\("visibilitychange", sync\)/);
});

test("hero tetap tanpa kontur: canvas baru muncul setelah hero lewat", () => {
  assert.match(source, /window\.scrollY/, "potongan canvas harus mengikuti posisi scroll");
  assert.match(source, /style\.clipPath/, "canvas dipotong agar hero tetap tanpa kontur");
  const hero = readFileSync(new URL("../src/components/Hero.tsx", import.meta.url), "utf8");
  assert.match(hero, /url\(\/photo\/dakmode-bg\.webp\)/);
  assert.match(hero, /url\(\/photo\/lightmode-bg\.webp\)/);
});