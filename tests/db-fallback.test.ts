import { test } from "node:test";
import assert from "node:assert/strict";
import { withFallback } from "../src/lib/db-fallback";

test("percobaan pertama berhasil → data diteruskan, tanpa percobaan tambahan", async () => {
  let calls = 0;
  const res = await withFallback(["a", "b"], async (cols) => {
    calls++;
    return { error: null, data: `data-${cols}` };
  });
  assert.equal(res.ok, true);
  assert.equal(res.attempts, 1);
  assert.equal(res.data, "data-a");
  assert.equal(calls, 1);
});

test("percobaan pertama gagal → jatuh ke berikutnya, data dari yang berhasil", async () => {
  const seen: string[] = [];
  const res = await withFallback(["full", "legacy"], async (cols) => {
    seen.push(cols);
    return cols === "full"
      ? { error: { message: 'column "device" does not exist' } }
      : { error: null, data: [1, 2, 3] };
  });
  assert.equal(res.ok, true);
  assert.equal(res.attempts, 2);
  assert.deepEqual(res.data, [1, 2, 3]);
  assert.deepEqual(seen, ["full", "legacy"]);
});

test("semua percobaan gagal → ok=false, error terakhir, tanpa data", async () => {
  const res = await withFallback(["a", "b"], async () => ({
    error: { message: "boom" },
  }));
  assert.equal(res.ok, false);
  assert.equal(res.attempts, 2);
  assert.equal(res.error, "boom");
  assert.equal(res.data, undefined);
});

test("error tanpa message → tetap string yang aman", async () => {
  const res = await withFallback(["a"], async () => ({ error: {} }));
  assert.equal(res.ok, false);
  assert.equal(typeof res.error, "string");
  assert.notEqual(res.error, "");
});

test("daftar percobaan kosong → ok=false, bukan crash", async () => {
  const res = await withFallback([], async () => ({ error: null }));
  assert.equal(res.ok, false);
  assert.equal(res.attempts, 0);
  assert.equal(typeof res.error, "string");
});

test("data null dari percobaan berhasil → data undefined, ok tetap true", async () => {
  const res = await withFallback(["a"], async () => ({
    error: null,
    data: null,
  }));
  assert.equal(res.ok, true);
  assert.equal(res.data, undefined);
});
