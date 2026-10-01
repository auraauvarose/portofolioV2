import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { partialUpdate } from "../src/lib/partial-update.ts";
import { isUuid } from "../src/lib/uuid.ts";
import { slugify, isValidSlug } from "../src/lib/slug.ts";

describe("partialUpdate", () => {
  const coercers = {
    title_en: (b: Record<string, unknown>) => b.title_en,
    category: (b: Record<string, unknown>) => b.category ?? "professional",
    sort_order: (b: Record<string, unknown>) => b.sort_order ?? 0,
  };

  test("hanya menyertakan kolom yang dikirim klien", () => {
    const patch = partialUpdate({ title_en: "Baru" }, coercers);
    assert.deepEqual(patch, { title_en: "Baru" });
  });

  test("tidak menghapus kolom yang absen dari body", () => {
    const patch = partialUpdate({ category: "personal" }, coercers);
    assert.deepEqual(Object.keys(patch), ["category"]);
    assert.equal("title_en" in patch, false);
    assert.equal("sort_order" in patch, false);
  });

  test("nilai null eksplisit tetap dikirim", () => {
    const patch = partialUpdate({ title_en: null }, coercers);
    assert.deepEqual(patch, { title_en: null });
  });

  test("body kosong menghasilkan patch kosong", () => {
    assert.deepEqual(partialUpdate({}, coercers), {});
  });

  test("body null/undefined tidak melempar", () => {
    assert.deepEqual(partialUpdate(null, coercers), {});
    assert.deepEqual(partialUpdate(undefined, coercers), {});
  });

  test("field warisan prototype tidak dianggap dikirim", () => {
    const patch = partialUpdate(
      Object.create({ title_en: "warisan" }) as Record<string, unknown>,
      coercers,
    );
    assert.deepEqual(patch, {});
  });
});

describe("isUuid", () => {
  test("menerima UUID v4 valid", () => {
    assert.equal(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301"), true);
  });

  test("menerima UUID huruf besar", () => {
    assert.equal(isUuid("3F2504E0-4F89-41D3-9A0C-0305E82C3301"), true);
  });

  test("menolak id non-UUID yang bikin error driver bocor", () => {
    for (const bad of [
      "demo-portfolio",
      "1",
      "3f2504e0-4f89-41d3-9a0c-0305e82c330",
      "3f2504e0-4f89-41d3-9a0c-0305e82c3301' or 1=1--",
      "",
      null,
      undefined,
      42,
    ]) {
      assert.equal(isUuid(bad), false, `harus menolak ${String(bad)}`);
    }
  });
});

describe("normalisasi slug dari input pengguna", () => {
  const normalize = (raw: unknown): string | null => {
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) return null;
    const slug = slugify(text);
    return isValidSlug(slug) ? slug : null;
  };

  test("judul berspasi diubah jadi slug valid", () => {
    assert.equal(normalize("My Project!"), "my-project");
    assert.equal(normalize("  Portfolio  Dashboard  "), "portfolio-dashboard");
  });

  test("input yang tidak menyisakan karakter aman jadi null", () => {
    assert.equal(normalize("!!!"), null);
    assert.equal(normalize("   "), null);
    assert.equal(normalize(undefined), null);
    assert.equal(normalize(123), null);
  });

  test("slug yang sudah bersih tidak berubah", () => {
    assert.equal(normalize("portfolio-dashboard"), "portfolio-dashboard");
  });
});
