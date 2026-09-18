import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { defaultSiteContent } from "../src/lib/site-content.ts";

// ============================================================================
// Konten situs memakai prinsip config-first: config.ts adalah DEFAULT dan
// database hanya MENIMPA. Test ini mengunci jaminan yang membuat situs tidak
// pernah blank:
//   1. default selalu lengkap (semua seksi ada dan tidak kosong),
//   2. override sebagian tidak menghapus key lain,
//   3. data yang bentuknya salah tidak merusak hasil.
// ============================================================================

describe("defaultSiteContent", () => {
  const content = defaultSiteContent();

  test("berisi semua seksi yang bisa diedit", () => {
    const expected = [
      "nav",
      "profile",
      "hero",
      "about",
      "whatIDo",
      "education",
      "techStack",
    ];
    for (const key of expected) {
      assert.ok(key in content, `seksi "${key}" hilang dari default`);
    }
  });

  test("tidak ada seksi yang kosong", () => {
    for (const [key, value] of Object.entries(content)) {
      if (Array.isArray(value)) {
        assert.ok(value.length > 0, `seksi "${key}" array kosong`);
      } else if (value && typeof value === "object") {
        assert.ok(
          Object.keys(value).length > 0,
          `seksi "${key}" objek kosong`,
        );
      } else {
        assert.ok(value, `seksi "${key}" bernilai kosong`);
      }
    }
  });

  test("profile punya field yang dipakai UI", () => {
    assert.ok(content.profile.name);
    assert.ok(content.profile.email);
    assert.ok(Array.isArray(content.profile.socials));
    assert.ok(content.profile.socials.length > 0);
    assert.ok(content.profile.cvUrl);
  });

  test("hero punya judul yang dirender", () => {
    assert.ok(content.hero.titleLine1?.en);
    assert.ok(content.hero.titleLine2?.en);
    assert.ok(content.hero.lensLine1?.en);
    assert.ok(content.hero.lensLine2?.en);
  });

  test("nav berupa array berisi pasangan en/id", () => {
    assert.ok(Array.isArray(content.nav));
    for (const item of content.nav) {
      assert.equal(typeof item.en, "string");
      assert.equal(typeof item.id, "string");
    }
  });

  test("techStack punya kategori dengan items", () => {
    assert.ok(Array.isArray(content.techStack.categories));
    for (const cat of content.techStack.categories) {
      assert.ok(cat.title?.en, "kategori tanpa judul");
      assert.ok(Array.isArray(cat.items));
      assert.ok(cat.items.length > 0, "kategori tanpa item");
    }
  });
});

describe("merge override (semantik yang dipakai getSiteContent)", () => {
  const base = defaultSiteContent();

  /** Cerminan mergeSection(): objek DB menimpa, key lain tetap. */
  const merge = <T extends object>(fallback: T, override: unknown): T =>
    !override || typeof override !== "object" || Array.isArray(override)
      ? fallback
      : { ...fallback, ...(override as Partial<T>) };

  test("override sebagian tidak menghapus key lain", () => {
    const merged = merge(base.profile, {
      name: "Nama Baru",
      email: "baru@example.com",
    });

    assert.equal(merged.name, "Nama Baru");
    assert.equal(merged.email, "baru@example.com");
    // Key yang tidak di-override harus tetap dari default.
    assert.equal(merged.cvUrl, base.profile.cvUrl);
    assert.deepEqual(merged.socials, base.profile.socials);
    assert.deepEqual(merged.location, base.profile.location);
  });

  test("override kosong mengembalikan default utuh", () => {
    assert.deepEqual(merge(base.profile, {}), base.profile);
  });

  test("data bentuk salah diabaikan, bukan merusak", () => {
    // Array dikirim untuk objek -> default dipakai.
    assert.deepEqual(merge(base.profile, [1, 2, 3]), base.profile);
    // String dikirim untuk objek -> default dipakai.
    assert.deepEqual(merge(base.profile, "teks"), base.profile);
    // null / undefined -> default dipakai.
    assert.deepEqual(merge(base.profile, null), base.profile);
    assert.deepEqual(merge(base.profile, undefined), base.profile);
  });

  test("override boleh menambah key baru", () => {
    const merged = merge(base.hero, { extraLine: "BARU" }) as Record<string, unknown>;
    assert.equal(merged.extraLine, "BARU");
    assert.equal(merged.titleLine1, base.hero.titleLine1);
  });

  test("default tidak ikut termutasi oleh override", () => {
    const before = JSON.stringify(base.profile);
    merge(base.profile, { name: "Berubah" });
    assert.equal(JSON.stringify(base.profile), before, "default termutasi!");
  });
});
