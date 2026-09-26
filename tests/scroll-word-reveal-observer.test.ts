import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SWR = readFileSync(
  resolve(here, "../src/components/ScrollWordReveal.tsx"),
  "utf8",
);

describe("ScrollWordReveal — observer cascade ikut mode pointer", () => {
  test("effect observer bergantung pada `fine`, bukan array kosong", () => {
    const m = SWR.match(
      /new IntersectionObserver[\s\S]*?\},\s*\[([^\]]*)\]\s*\);/,
    );
    assert.ok(
      m,
      "effect IntersectionObserver tidak ditemukan di ScrollWordReveal.tsx",
    );
    const deps = m[1]
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    assert.deepEqual(
      deps,
      ["fine"],
      `deps effect observer harus [fine] (agar re-run saat snapshot pointer berubah), dapat [${deps.join(", ")}]`,
    );
  });

  test("`fine` dideklarasikan sebelum effect observer (hindari TDZ)", () => {
    const decl = SWR.indexOf("const fine = useFinePointer()");
    const effect = SWR.indexOf("new IntersectionObserver");
    assert.ok(
      decl > -1,
      "deklarasi `const fine = useFinePointer()` tidak ditemukan",
    );
    assert.ok(effect > -1, "IntersectionObserver tidak ditemukan");
    assert.ok(
      decl < effect,
      "`fine` dipakai sebagai dependency sebelum dideklarasikan (TDZ)",
    );
  });

  test("cabang cascade memasang ref={rootRef} yang diobservasi", () => {
    const cascade = SWR.slice(SWR.indexOf("const container: Variants"));
    assert.ok(cascade.length > 0, "blok `const container: Variants` tidak ditemukan");
    assert.match(
      cascade,
      /ref=\{rootRef\}/,
      "cabang cascade tidak memasang ref={rootRef}, observer tidak akan pernah dibuat",
    );
  });
});
