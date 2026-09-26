import { test, describe } from "node:test";
import assert from "node:assert/strict";

const TABLES = [
  "projects",
  "certifications",
  "gallery_photos",
  "experience",
  "testimonials",
] as const;

const isTable = (v: unknown): boolean =>
  typeof v === "string" && (TABLES as readonly string[]).includes(v);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (v: unknown): boolean => typeof v === "string" && UUID_RE.test(v);

const VALID_UUID = "2cb308a3-1528-43ca-8f16-2839fd47a481";

describe("validasi tabel", () => {
  test("menerima tabel yang terdaftar", () => {
    for (const t of TABLES) assert.ok(isTable(t), `${t} seharusnya diterima`);
  });

  test("menolak tabel di luar daftar putih", () => {
    assert.ok(!isTable("contact_messages"), "inbox tidak boleh diurutkan");
    assert.ok(!isTable("users"));
    assert.ok(!isTable("site_content"));
  });

  test("menolak upaya injeksi lewat nama tabel", () => {
    assert.ok(!isTable("projects; drop table projects"));
    assert.ok(!isTable("projects--"));
    assert.ok(!isTable("projects, users"));
    assert.ok(!isTable("public.projects"));
  });

  test("menolak nilai non-string", () => {
    assert.ok(!isTable(null));
    assert.ok(!isTable(undefined));
    assert.ok(!isTable(123));
    assert.ok(!isTable({}));
    assert.ok(!isTable(["projects"]));
  });
});

describe("validasi id", () => {
  test("menerima UUID valid", () => {
    assert.ok(isUuid(VALID_UUID));
    assert.ok(isUuid(VALID_UUID.toUpperCase()));
  });

  test("menolak yang bukan UUID", () => {
    assert.ok(!isUuid("1"));
    assert.ok(!isUuid("bukan-uuid"));
    assert.ok(!isUuid(""));
    assert.ok(!isUuid(VALID_UUID + "x"));
    assert.ok(!isUuid("2cb308a3-1528-43ca-8f16"));
  });

  test("menolak upaya injeksi lewat id", () => {
    assert.ok(!isUuid("1' or '1'='1"));
    assert.ok(!isUuid("*"));
    assert.ok(!isUuid("all"));
    assert.ok(!isUuid("1,2,3"));
  });
});

describe("aturan payload (cerminan handler)", () => {
  function validate(body: unknown): { ok: boolean; error?: string } {
    if (!body || typeof body !== "object") return { ok: false, error: "bentuk" };
    const { table, ids } = body as { table?: unknown; ids?: unknown };

    if (!isTable(table)) return { ok: false, error: "tabel" };
    if (!Array.isArray(ids) || ids.length === 0)
      return { ok: false, error: "ids kosong" };
    if (ids.length > 500) return { ok: false, error: "terlalu banyak" };
    if (!ids.every(isUuid)) return { ok: false, error: "id tidak valid" };
    if (new Set(ids).size !== ids.length)
      return { ok: false, error: "duplikat" };
    return { ok: true };
  }

  const U2 = "6a864a5e-b0b0-419c-b0c9-521d85cbbfb2";

  test("payload benar diterima", () => {
    assert.ok(validate({ table: "projects", ids: [VALID_UUID, U2] }).ok);
  });

  test("menolak ids kosong", () => {
    assert.equal(validate({ table: "projects", ids: [] }).error, "ids kosong");
  });

  test("menolak ids bukan array", () => {
    assert.equal(
      validate({ table: "projects", ids: "bukan-array" }).error,
      "ids kosong",
    );
  });

  test("menolak satu id tidak valid di antara yang valid", () => {
    assert.equal(
      validate({ table: "projects", ids: [VALID_UUID, "rusak"] }).error,
      "id tidak valid",
    );
  });

  test("menolak duplikat", () => {
    assert.equal(
      validate({ table: "projects", ids: [VALID_UUID, VALID_UUID] }).error,
      "duplikat",
    );
  });

  test("menolak lebih dari 500 item", () => {
    const many = Array.from({ length: 501 }, () => VALID_UUID);
    assert.equal(validate({ table: "projects", ids: many }).error, "terlalu banyak");
  });

  test("menolak body bukan objek", () => {
    assert.equal(validate(null).error, "bentuk");
    assert.equal(validate("teks").error, "bentuk");
    assert.equal(validate(undefined).error, "bentuk");
  });

  test("menolak tabel tidak dikenal walau ids valid", () => {
    assert.equal(
      validate({ table: "contact_messages", ids: [VALID_UUID] }).error,
      "tabel",
    );
  });
});
