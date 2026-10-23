# Doublecheck spec

## Goal
Log kunjungan di panel admin menampilkan alamat IP penuh setiap perangkat yang mengunjungi situs.

## Scope
In-scope: supabase/tahap6.sql (kolom baru), src/app/api/analytics/route.ts (insert + select), src/lib/visit-log.ts (tipe + mapping), src/lib/analytics-summary.ts (normalisasi), src/components/admin/AnalyticsPanel.tsx (tampilan), tests/visit-log.test.ts (test baru). Out-of-scope: perubahan pada visitorHash/throttle, UI lain, migrasi lama.

## Acceptance criteria
1) `npm run typecheck` exit 0. 2) `npm test` lulus termasuk test baru visitLogEntry yang memuat field ip. 3) Payload insert POST /api/analytics memuat `ip` dari clientIp(req). 4) GET memilih kolom ip dan mengirimkannya ke visitLogEntry. 5) Panel admin merender IP di log kunjungan.

## Failure modes
- Kolom ip belum ada di DB → withFallback harus turun ke select tanpa ip agar GET tetap jalan (tidak 500). - clientIp mengembalikan "unknown" → tampilkan "—". - Baris lama tanpa ip (NULL) → tampilkan "—", tidak crash. - Normalizer analytics-summary harus menerima objek tanpa ip agar data lama tetap valid.

## Priorities
Prioritas: (1) GET tidak boleh gagal walau migrasi belum dijalankan, (2) tampilan rapi, (3) minimal diff. Opsional: pemformatan/penyamaran IP.

## Non-goals
Tidak menyimpan user-agent mentah, tidak menambah cookie/ID pelacak, tidak mengubah RLS, tidak backfill baris lama, tidak mengubah desain panel di luar kolom IP.
