import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  REORDER_TABLES,
  MAX_REORDER_ITEMS,
  isReorderTable,
  validateReorderPayload,
} from "../src/lib/reorder-validation.ts";
import { isUuid } from "../src/lib/uuid.ts";

const VALID_UUID = "2cb308a3-1528-43ca-8f16-2839fd47a481";
const U2 = "6a864a5e-b0b0-419c-b0c9-521d85cbbfb2";

describe("validasi tabel", () => {
  test("menerima tabel yang terdaftar", () => {
    for (const t of REORDER_TABLES) {
      assert.ok(isReorderTable(t), `${t} seharusnya diterima`);
    }
  });

  test("menolak tabel di luar daftar putih", () => {
    assert.ok(!isReorderTable("contact_messages"), "inbox tidak boleh diurutkan");
    assert.ok(!isReorderTable("users"));
    assert.ok(!isReorderTable("site_content"));
  });

  test("menolak upaya injeksi lewat nama tabel", () => {
    assert.ok(!isReorderTable("projects; drop table projects"));
    assert.ok(!isReorderTable("projects--"));
    assert.ok(!isReorderTable("projects, users"));
    assert.ok(!isReorderTable("public.projects"));
  });

  test("menolak nilai non-string", () => {
    assert.ok(!isReorderTable(null));
    assert.ok(!isReorderTable(undefined));
    assert.ok(!isReorderTable(123));
    assert.ok(!isReorderTable({}));
    assert.ok(!isReorderTable(["projects"]));
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

describe("validateReorderPayload", () => {
  const errorOf = (body: unknown): string | undefined => {
    const result = validateReorderPayload(body);
    return result.ok ? undefined : result.error;
  };

  test("payload benar diterima", () => {
    const result = validateReorderPayload({
      table: "projects",
      ids: [VALID_UUID, U2],
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.table, "projects");
      assert.deepEqual(result.ids, [VALID_UUID, U2]);
    }
  });

  test("menolak ids kosong", () => {
    assert.equal(
      errorOf({ table: "projects", ids: [] }),
      "ids wajib berupa array.",
    );
  });

  test("menolak ids bukan array", () => {
    assert.equal(
      errorOf({ table: "projects", ids: "bukan-array" }),
      "ids wajib berupa array.",
    );
  });

  test("menolak satu id tidak valid di antara yang valid", () => {
    assert.equal(
      errorOf({ table: "projects", ids: [VALID_UUID, "rusak"] }),
      "Ada id yang tidak valid.",
    );
  });

  test("menolak duplikat", () => {
    assert.equal(
      errorOf({ table: "projects", ids: [VALID_UUID, VALID_UUID] }),
      "Ada id duplikat.",
    );
  });

  test("menolak lebih dari batas item", () => {
    const many = Array.from({ length: MAX_REORDER_ITEMS + 1 }, (_, i) =>
      `2cb308a3-1528-43ca-8f16-${String(i).padStart(12, "0")}`,
    );
    assert.equal(
      errorOf({ table: "projects", ids: many }),
      "Terlalu banyak item.",
    );
  });

  test("menerima tepat di batas item", () => {
    const unique = Array.from({ length: MAX_REORDER_ITEMS }, (_, i) =>
      `2cb308a3-1528-43ca-8f16-${String(i).padStart(12, "0")}`,
    );
    assert.equal(validateReorderPayload({ table: "projects", ids: unique }).ok, true);
  });

  test("menolak body bukan objek", () => {
    for (const body of [null, "teks", undefined, 42, true]) {
      assert.equal(errorOf(body), "Data tidak valid.");
    }
  });

  test("menolak tabel tidak dikenal walau ids valid", () => {
    assert.equal(
      errorOf({ table: "contact_messages", ids: [VALID_UUID] }),
      "Tabel tidak dikenal.",
    );
  });

  test("menolak tabel yang hilang", () => {
    assert.equal(errorOf({ ids: [VALID_UUID] }), "Tabel tidak dikenal.");
  });
});
