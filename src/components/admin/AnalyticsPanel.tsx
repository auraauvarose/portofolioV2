"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshIcon, SpinnerIcon, InboxIcon } from "@/components/admin/icons";

// ============================================================================
// AnalyticsPanel — ringkasan kunjungan.
//
// Datanya sengaja tanpa cookie & tanpa PII: hanya path, hostname referrer, dan
// hash ber-salt untuk menghitung kunjungan unik. Lihat /api/analytics.
// ============================================================================

type Summary = {
  migrated: boolean;
  days: number;
  total: number;
  unique: number;
  byDay: { date: string; count: number }[];
  topPaths: { label: string; count: number }[];
  topReferrers: { label: string; count: number }[];
};

const RANGES = [7, 30, 90] as const;

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AnalyticsPanel() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${days}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Gagal memuat statistik");
        setData(null);
      } else {
        setData(json as Summary);
      }
    } catch {
      setError("Gagal memuat statistik");
      setData(null);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const maxDay = Math.max(1, ...(data?.byDay.map((d) => d.count) ?? [1]));
  const maxPath = Math.max(1, ...(data?.topPaths.map((p) => p.count) ?? [1]));
  const maxRef = Math.max(1, ...(data?.topReferrers.map((r) => r.count) ?? [1]));

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">
            Statistik
          </p>
          <h2 className="text-display text-2xl uppercase text-white">Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                aria-pressed={days === r}
                className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors duration-300 ${
                  days === r
                    ? "bg-accent text-black"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {r}h
              </button>
            ))}
          </div>
          <button
            onClick={load}
            aria-label="Muat ulang"
            title="Muat ulang"
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-300 transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <SpinnerIcon /> : <RefreshIcon />}
          </button>
        </div>
      </div>

      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-gray-500">
        Tanpa cookie dan tanpa data pribadi — IP hanya disimpan sebagai hash
        ber-salt untuk menghitung kunjungan unik. Kunjungan ke{" "}
        <code className="text-accent">/admin</code> tidak dihitung.
      </p>

      {error && (
        <p className="mb-4 border-l-2 border-red-500 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {data && !data.migrated && (
        <p className="mb-4 border-l-2 border-yellow-500/60 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-300">
          Tabel <code>page_views</code> belum ada. Jalankan{" "}
          <code>supabase/tahap3.sql</code> di Supabase SQL Editor untuk mulai
          mencatat.
        </p>
      )}

      {data && data.migrated && data.total === 0 && (
        <div className="mb-8 flex flex-col items-center gap-3 border-y border-white/10 py-14 text-center">
          <InboxIcon className="text-gray-600" />
          <p className="text-sm text-gray-500">
            Belum ada kunjungan tercatat dalam {days} hari terakhir.
          </p>
          <p className="max-w-md text-xs text-gray-600">
            Pencatatan hanya aktif bila{" "}
            <code className="text-accent">NEXT_PUBLIC_ANALYTICS_ENABLED=true</code>.
          </p>
        </div>
      )}

      {data && data.migrated && data.total > 0 && (
        <div className="flex flex-col gap-8">
          {/* Ringkasan angka */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total kunjungan", value: data.total },
              { label: "Pengunjung unik", value: data.unique },
              {
                label: "Rata-rata / hari",
                value: Math.round(data.total / Math.max(1, data.byDay.length)),
              },
            ].map((s) => (
              <div key={s.label} className="border border-white/10 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  {s.label}
                </p>
                <p className="text-display mt-2 text-3xl text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Per hari */}
          <section>
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">
              Per hari
            </h3>
            <div className="flex h-32 items-end gap-1">
              {data.byDay.map((d) => (
                <div
                  key={d.date}
                  className="group relative flex-1"
                  title={`${d.date}: ${d.count}`}
                >
                  <div
                    className="w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
                    style={{
                      height: `${Math.max(3, (d.count / maxDay) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-600">
              <span>{data.byDay[0]?.date}</span>
              <span>{data.byDay[data.byDay.length - 1]?.date}</span>
            </div>
          </section>

          {/* Halaman & referrer */}
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">
                Halaman teratas
              </h3>
              <ul className="flex flex-col gap-3">
                {data.topPaths.map((p) => (
                  <li key={p.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <code className="truncate text-gray-300">{p.label}</code>
                      <span className="shrink-0 text-xs text-gray-500">{p.count}</span>
                    </div>
                    <Bar value={p.count} max={maxPath} />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">
                Sumber kunjungan
              </h3>
              {data.topReferrers.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Semua kunjungan langsung (tanpa referrer).
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.topReferrers.map((r) => (
                    <li key={r.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate text-gray-300">{r.label}</span>
                        <span className="shrink-0 text-xs text-gray-500">{r.count}</span>
                      </div>
                      <Bar value={r.count} max={maxRef} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
