"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chip,
  EmptyState,
  IconButton,
  ListSkeleton,
  Notice,
  PanelHeader,
  SegmentedFilter,
} from "@/components/admin/ui";
import {
  RefreshIcon,
  SpinnerIcon,
  ChartIcon,
  InfoIcon,
} from "@/components/admin/icons";
import { deviceLabel } from "@/lib/visit-log";
import {
  normalizeSummary,
  type AnalyticsSummary,
} from "@/lib/analytics-summary";

// ============================================================================
// AnalyticsPanel — ringkasan kunjungan.
//
// Datanya sengaja tanpa cookie & tanpa PII: hanya path, hostname referrer, dan
// hash ber-salt untuk menghitung kunjungan unik. Lihat /api/analytics.
//
// Grafik harian memakai batang berbagi-skala dengan sumbu nol yang jelas,
// supaya tinggi batang bisa dibandingkan secara langsung. Nilai puncak
// ditandai agar tidak perlu menebak dari tinggi saja.
//
// Respons API selalu lewat normalizeSummary: panel tidak boleh crash hanya
// karena field baru belum ada di respons (versi lama / cache).
// ============================================================================

const RANGES = [7, 30, 90] as const;

/** Label jam: 0 → "00:00" ... 23 → "23:00" (zona WIB). */
function hourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

/** Format tanggal ringkas untuk label sumbu: "12 Feb". */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-a-surface-2)]">
      <div
        className="h-full rounded-full bg-[var(--color-a-accent)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Angka besar dengan label kecil — pola ringkasan yang mudah dipindai. */
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="a-panel p-4">
      <p className="a-key">{label}</p>
      <p className="a-data mt-2 text-3xl font-semibold leading-none text-[var(--color-a-text)]">
        {value.toLocaleString("id-ID")}
      </p>
      {hint && (
        <p className="mt-1.5 a-meta text-[var(--color-a-faint)]">{hint}</p>
      )}
    </div>
  );
}

export default function AnalyticsPanel() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${days}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Gagal memuat statistik");
        setData(null);
      } else {
        setData(normalizeSummary(json));
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
  const maxHour = Math.max(1, ...(data?.byHour.map((h) => h.count) ?? [1]));
  const maxLoc = Math.max(
    1,
    ...(data?.topLocations.map((l) => l.count) ?? [1]),
  );
  /** Log kunjungan terakhir — default array kosong bila respons lama tanpa field ini. */
  const recentVisits = data?.recentVisits ?? [];

  /** Jam tersibuk (WIB) — ditandai di grafik jam. */
  const peakHour = useMemo(() => {
    if (!data?.byHour.length) return null;
    return data.byHour.reduce((a, b) => (b.count > a.count ? b : a)).hour;
  }, [data]);

  /** Hari tersibuk — ditandai di grafik supaya puncak tidak perlu ditebak. */
  const peakDate = useMemo(() => {
    if (!data?.byDay.length) return null;
    return data.byDay.reduce((a, b) => (b.count > a.count ? b : a)).date;
  }, [data]);

  const perDay =
    data && data.byDay.length > 0
      ? Math.round(data.total / data.byDay.length)
      : 0;

  return (
    <div>
      <PanelHeader
        title="Statistik"
        description="Tanpa cookie dan tanpa data pribadi. Alamat IP hanya disimpan sebagai hash ber-salt untuk menghitung kunjungan unik. Kunjungan ke /admin tidak dihitung."
        meta={
          !loading &&
          data?.migrated && (
            <>
              <Chip tone="neutral">{data.days} hari terakhir</Chip>
              <Chip tone="accent">{data.total} kunjungan</Chip>
            </>
          )
        }
        actions={
          <>
            <SegmentedFilter
              label="Rentang waktu"
              value={String(days)}
              onChange={(key) => setDays(Number(key))}
              options={RANGES.map((r) => ({
                key: String(r),
                label: `${r} hari`,
              }))}
            />
            <IconButton
              icon={loading ? SpinnerIcon : RefreshIcon}
              label="Muat ulang"
              disabled={loading}
              onClick={load}
            />
          </>
        }
      />

      {error && (
        <Notice tone="error" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      )}

      {data && !data.migrated && (
        <Notice tone="warn">
          Tabel <code className="a-data">page_views</code> belum ada. Jalankan{" "}
          <code className="a-data">supabase/tahap3.sql</code> di Supabase SQL
          Editor untuk mulai mencatat.
        </Notice>
      )}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : data && data.migrated && data.total === 0 ? (
        <EmptyState
          icon={ChartIcon}
          title={`Belum ada kunjungan dalam ${days} hari terakhir`}
          hint={
            <>
              Pencatatan hanya aktif bila{" "}
              <code className="a-data text-[var(--color-a-accent)]">
                NEXT_PUBLIC_ANALYTICS_ENABLED=true
              </code>
              .
            </>
          }
        />
      ) : data && data.migrated ? (
        <div className="flex flex-col gap-7">
          {/* Ringkasan angka */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total kunjungan" value={data.total} />
            <Stat label="Pengunjung unik" value={data.unique} />
            <Stat
              label="Rata-rata per hari"
              value={perDay}
              hint={`dari ${data.byDay.length} hari tercatat`}
            />
          </div>

          {/* Per hari */}
          <section className="a-panel p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="a-key">Kunjungan per hari</h3>
              {peakDate && (
                <p className="a-meta text-[var(--color-a-faint)]">
                  Puncak{" "}
                  <span className="a-data text-[var(--color-a-dim)]">
                    {shortDate(peakDate)}
                  </span>{" "}
                  ·{" "}
                  <span className="a-data text-[var(--color-a-dim)]">
                    {maxDay}
                  </span>{" "}
                  kunjungan
                </p>
              )}
            </div>

            {/* Batang berbagi skala. Tinggi minimum 3% supaya hari bernilai
                nol tetap terlihat sebagai garis dasar, bukan hilang. */}
            <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`Grafik kunjungan harian selama ${data.days} hari, puncak ${maxDay} kunjungan`}>
              {data.byDay.map((d) => {
                const isPeak = d.date === peakDate && d.count > 0;
                return (
                  <div
                    key={d.date}
                    className="group/bar relative flex-1"
                    title={`${shortDate(d.date)}: ${d.count} kunjungan`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        isPeak
                          ? "bg-[var(--color-a-accent)]"
                          : "bg-[var(--color-a-accent)]/45 group-hover/bar:bg-[var(--color-a-accent)]/80"
                      }`}
                      style={{
                        height: `${Math.max(3, (d.count / maxDay) * 100)}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex justify-between a-micro text-[var(--color-a-faint)]">
              <span className="a-data">
                {data.byDay[0] && shortDate(data.byDay[0].date)}
              </span>
              <span className="a-data">
                {data.byDay[data.byDay.length - 1] &&
                  shortDate(data.byDay[data.byDay.length - 1].date)}
              </span>
            </div>
          </section>

          {/* Halaman & referrer */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="a-panel p-4 sm:p-5">
              <h3 className="a-key mb-4">Halaman teratas</h3>
              {data.topPaths.length === 0 ? (
                <p className="text-sm text-[var(--color-a-faint)]">
                  Belum ada data halaman.
                </p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {data.topPaths.map((p) => (
                    <li key={p.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <code className="a-data truncate text-xs text-[var(--color-a-text)]">
                          {p.label}
                        </code>
                        <span className="a-data shrink-0 text-xs text-[var(--color-a-dim)]">
                          {p.count.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Bar value={p.count} max={maxPath} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="a-panel p-4 sm:p-5">
              <h3 className="a-key mb-4">Sumber kunjungan</h3>
              {data.topReferrers.length === 0 ? (
                <p className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-a-faint)]">
                  <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Semua kunjungan datang langsung, tanpa situs perujuk.
                </p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {data.topReferrers.map((r) => (
                    <li key={r.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="truncate text-xs text-[var(--color-a-text)]">
                          {r.label}
                        </span>
                        <span className="a-data shrink-0 text-xs text-[var(--color-a-dim)]">
                          {r.count.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Bar value={r.count} max={maxRef} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Perangkat · Jam · Lokasi */}
          {/* Perangkat · Jam · Lokasi */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Perangkat */}
            <section className="a-panel p-4 sm:p-5">
              <h3 className="a-key mb-4">Perangkat</h3>
              {data.byDevice.length === 0 ? (
                <p className="text-sm text-[var(--color-a-faint)]">
                  Belum ada data perangkat.
                </p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {data.byDevice.map((d) => (
                    <li key={d.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-xs text-[var(--color-a-text)]">
                          {deviceLabel(d.label)}
                        </span>
                        <span className="a-data shrink-0 text-xs text-[var(--color-a-dim)]">
                          {d.count.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Bar value={d.count} max={Math.max(1, ...data.byDevice.map((x) => x.count))} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Browser */}
            <section className="a-panel p-4 sm:p-5">
              <h3 className="a-key mb-4">Browser</h3>
              {data.byBrowser.length === 0 ? (
                <p className="text-sm text-[var(--color-a-faint)]">
                  Belum ada data browser.
                </p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {data.byBrowser.map((b) => (
                    <li key={b.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-xs text-[var(--color-a-text)]">
                          {b.label}
                        </span>
                        <span className="a-data shrink-0 text-xs text-[var(--color-a-dim)]">
                          {b.count.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Bar
                        value={b.count}
                        max={Math.max(1, ...data.byBrowser.map((x) => x.count))}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Merek ponsel — hanya perangkat mobile yang punya merek. */}
            <section className="a-panel p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="a-key">Merek ponsel</h3>
                <p className="a-meta text-[var(--color-a-faint)]">
                  Hanya perangkat mobile
                </p>
              </div>
              {data.byPhoneBrand.length === 0 ? (
                <p className="text-sm text-[var(--color-a-faint)]">
                  Belum ada data merek ponsel.
                </p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {data.byPhoneBrand.map((b) => (
                    <li key={b.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-xs text-[var(--color-a-text)]">
                          {b.label}
                        </span>
                        <span className="a-data shrink-0 text-xs text-[var(--color-a-dim)]">
                          {b.count.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Bar
                        value={b.count}
                        max={Math.max(1, ...data.byPhoneBrand.map((x) => x.count))}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Jam kunjungan (WIB) */}
            <section className="a-panel p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="a-key">Jam kunjungan (WIB)</h3>
                {peakHour !== null && (
                  <p className="a-meta text-[var(--color-a-faint)]">
                    Tersibuk{" "}
                    <span className="a-data text-[var(--color-a-dim)]">
                      {hourLabel(peakHour)}
                    </span>
                  </p>
                )}
              </div>
              {data.byHour.length === 0 ? (
                <p className="text-sm text-[var(--color-a-faint)]">
                  Belum ada data jam.
                </p>
              ) : (
                <>
                  {/* Batang per jam 00–23 dalam WIB; tinggi dibagi skala maksimum. */}
                  <div
                    className="flex h-28 items-end gap-[2px]"
                    role="img"
                    aria-label={`Grafik kunjungan per jam WIB, tersibuk ${peakHour !== null ? hourLabel(peakHour) : "-"}`}
                  >
                    {Array.from({ length: 24 }, (_, h) => {
                      const count = data.byHour.find((x) => x.hour === h)?.count ?? 0;
                      const isPeak = h === peakHour && count > 0;
                      return (
                        <div
                          key={h}
                          className="group/hour relative flex-1"
                          title={`${hourLabel(h)} WIB: ${count} kunjungan`}
                        >
                          <div
                            className={`w-full rounded-t-sm transition-colors ${
                              isPeak
                                ? "bg-[var(--color-a-accent)]"
                                : "bg-[var(--color-a-accent)]/45 group-hover/hour:bg-[var(--color-a-accent)]/80"
                            }`}
                            style={{
                              height: `${Math.max(3, (count / maxHour) * 100)}%`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between a-micro text-[var(--color-a-faint)]">
                    <span className="a-data">00:00</span>
                    <span className="a-data">23:00</span>
                  </div>
                </>
              )}
            </section>

            {/* Lokasi */}
            <section className="a-panel p-4 sm:p-5 md:col-span-2">
              <h3 className="a-key mb-4">Lokasi pengunjung</h3>
              {data.topLocations.length === 0 ? (
                <p className="text-sm text-[var(--color-a-faint)]">
                  Belum ada data lokasi.
                </p>
              ) : (
                <ul className="grid gap-3.5 sm:grid-cols-2">
                  {data.topLocations.map((l) => (
                    <li key={l.label}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="truncate text-xs text-[var(--color-a-text)]">
                          {l.label}
                        </span>
                        <span className="a-data shrink-0 text-xs text-[var(--color-a-dim)]">
                          {l.count.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <Bar value={l.count} max={maxLoc} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Log kunjungan terakhir: device - lokasi - jam WIB */}
          <section className="a-panel p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="a-key">Log kunjungan terakhir</h3>
              {recentVisits.length > 0 && (
                <p className="a-meta text-[var(--color-a-faint)]">
                  {recentVisits.length} kunjungan terbaru
                </p>
              )}
            </div>
            {recentVisits.length === 0 ? (
              <p className="text-sm text-[var(--color-a-faint)]">
                Belum ada kunjungan tercatat.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-[var(--color-a-line)]">
                {recentVisits.map((v, i) => (
                  <li
                    key={`${v.time}-${i}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5"
                  >
                    {/* Urutan sesuai permintaan: device - lokasi - jam. */}
                    <span className="w-20 shrink-0 text-xs font-medium text-[var(--color-a-text)]">
                      {v.device}
                    </span>
                    <span className="text-xs text-[var(--color-a-faint)]">
                      {v.location}
                    </span>
                    <span className="a-data shrink-0 text-xs text-[var(--color-a-dim)]">
                      {v.time}
                    </span>
                    <code className="a-data ml-auto truncate text-[11px] text-[var(--color-a-faint)]">
                      {v.path}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
