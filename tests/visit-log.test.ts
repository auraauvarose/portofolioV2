// Test untuk log kunjungan: format jam WIB dan entri log
// "nama device - lokasi - jam".
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatWibTime,
  visitLogEntry,
  deviceLabel,
} from "../src/lib/visit-log";

test("formatWibTime: UTC dikonversi ke WIB (UTC+7)", () => {
  assert.equal(formatWibTime("2026-02-12T07:32:00Z"), "14:32 WIB · 12 Feb");
});

test("formatWibTime: konversi lintas hari (18:00 UTC → 01:00 WIB besok)", () => {
  assert.equal(formatWibTime("2026-02-12T18:00:00Z"), "01:00 WIB · 13 Feb");
});

test("formatWibTime: ISO tidak valid → '-'", () => {
  assert.equal(formatWibTime("bukan-tanggal"), "-");
});

test("formatWibTime: null → '-'", () => {
  assert.equal(formatWibTime(null), "-");
});

test("deviceLabel: satu sumber label untuk panel & log", () => {
  assert.equal(deviceLabel("mobile"), "Ponsel");
  assert.equal(deviceLabel("tablet"), "Tablet");
  assert.equal(deviceLabel("desktop"), "Desktop");
  assert.equal(deviceLabel(null), "—");
  assert.equal(deviceLabel("unknown-ua"), "unknown-ua");
});

test("visitLogEntry: path ikut disertakan, tanpa placeholder", () => {
  const e = visitLogEntry({
    path: "/tentang",
    device: "mobile",
    city: "Jakarta",
    country: "ID",
    created_at: "2026-02-12T07:32:00Z",
  });
  assert.equal(e.path, "/tentang");
  assert.equal(e.device, "Ponsel");
  assert.equal(e.location, "Jakarta, ID");
  assert.equal(e.time, "14:32 WIB · 12 Feb");
});

test("visitLogEntry: device + lokasi (kota, negara) + jam WIB", () => {
  const e = visitLogEntry({
    path: "/",
    device: "mobile",
    city: "Jakarta",
    country: "ID",
    created_at: "2026-02-12T07:32:00Z",
  });
  assert.equal(e.device, "Ponsel");
  assert.equal(e.location, "Jakarta, ID");
  assert.equal(e.time, "14:32 WIB · 12 Feb");
});

test("visitLogEntry: hanya negara → lokasi = kode negara", () => {
  const e = visitLogEntry({
    path: "/",
    device: "desktop",
    city: null,
    country: "SG",
    created_at: "2026-02-12T07:32:00Z",
  });
  assert.equal(e.device, "Desktop");
  assert.equal(e.location, "SG");
});

test("visitLogEntry: hanya kota → lokasi = nama kota", () => {
  const e = visitLogEntry({
    path: "/",
    device: "tablet",
    city: "Bandung",
    country: null,
    created_at: "2026-02-12T07:32:00Z",
  });
  assert.equal(e.location, "Bandung");
});

test("visitLogEntry: device/lokasi kosong → fallback '—'", () => {
  const e = visitLogEntry({
    path: "/",
    device: null,
    city: null,
    country: null,
    created_at: "2026-02-12T07:32:00Z",
  });
  assert.equal(e.device, "—");
  assert.equal(e.location, "—");
  assert.equal(e.time, "14:32 WIB · 12 Feb");
});