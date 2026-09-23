// Normalisasi ringkasan analitik sebelum dipakai panel.
//
// Panel menerima JSON dari /api/analytics tanpa validasi runtime. Bila respons
// datang dari versi lama (field device/jam/lokasi belum ada) atau berbentuk tak
// terduga, akses `.length` pada field yang hilang akan membuat panel crash.
// Fungsi ini memaksa bentuk yang aman: semua daftar jadi array, semua angka
// jadi number (NaN → 0), dan entri log cacat dibuang.

import type { VisitLogEntry } from "./visit-log";

export type CountedLabel = { label: string; count: number };
export type DayCount = { date: string; count: number };
export type HourCount = { hour: number; count: number };

export type AnalyticsSummary = {
  migrated: boolean;
  days: number;
  total: number;
  unique: number;
  byDay: DayCount[];
  topPaths: CountedLabel[];
  topReferrers: CountedLabel[];
  byDevice: CountedLabel[];
  byHour: HourCount[];
  topLocations: CountedLabel[];
  recentVisits: VisitLogEntry[];
};

export const DEFAULT_DAYS = 30;

/** Angka aman: NaN/Infinity/tipe lain → 0. */
function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Daftar aman: bukan array → []. */
function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function counted(value: unknown): CountedLabel[] {
  return arr(value)
    .filter(isObject)
    .map((item) => ({ label: String(item.label ?? ""), count: num(item.count) }));
}

function dayCounts(value: unknown): DayCount[] {
  return arr(value)
    .filter(isObject)
    .map((item) => ({ date: String(item.date ?? ""), count: num(item.count) }));
}

function hourCounts(value: unknown): HourCount[] {
  return arr(value)
    .filter(isObject)
    .map((item) => ({ hour: num(item.hour), count: num(item.count) }));
}

function visitEntries(value: unknown): VisitLogEntry[] {
  return arr(value)
    .filter(isObject)
    .filter(
      (item) =>
        typeof item.path === "string" &&
        typeof item.device === "string" &&
        typeof item.location === "string" &&
        typeof item.time === "string",
    )
    .map((item) => ({
      path: item.path as string,
      device: item.device as string,
      location: item.location as string,
      time: item.time as string,
    }));
}

/** Ringkasan kosong yang aman dipakai panel (semua section tampil kosong). */
function emptySummary(days: number = DEFAULT_DAYS): AnalyticsSummary {
  return {
    migrated: true,
    days,
    total: 0,
    unique: 0,
    byDay: [],
    topPaths: [],
    topReferrers: [],
    byDevice: [],
    byHour: [],
    topLocations: [],
    recentVisits: [],
  };
}

export function normalizeSummary(input: unknown): AnalyticsSummary {
  if (!isObject(input)) return emptySummary();

  return {
    // Absen → false: panel menampilkan notice migrasi, bukan gagal diam.
    migrated: input.migrated === true,
    days: num(input.days) || DEFAULT_DAYS,
    total: num(input.total),
    unique: num(input.unique),
    byDay: dayCounts(input.byDay),
    topPaths: counted(input.topPaths),
    topReferrers: counted(input.topReferrers),
    byDevice: counted(input.byDevice),
    byHour: hourCounts(input.byHour),
    topLocations: counted(input.topLocations),
    recentVisits: visitEntries(input.recentVisits),
  };
}
