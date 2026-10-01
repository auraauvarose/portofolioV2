# Doublecheck spec

## Goal
Default tema situs kembali seperti semula: kunjungan pertama tampil GELAP (dark).

## Scope
Perubahan tema default dibatalkan penuh (revert) pada src/lib/theme.ts, src/components/providers.tsx, src/app/layout.tsx, dan tests/page-controls.test.ts. Tidak ada perubahan tema yang tersisa.

## Acceptance criteria
1) readStoredTheme(null/"sepia"/"") === "dark". 2) useState awal "dark". 3) html di-render dengan class dark + colorScheme dark. 4) Skrip anti-flash kembali ke bentuk asli. 5) `git diff` untuk keempat file kosong (identik dengan HEAD).

## Failure modes
1) Revert tidak lengkap → git diff menyisakan perubahan tema. 2) Test ekspektasi light tertinggal → suite gagal.

## Priorities
Prioritas: kembali persis ke kondisi awal > suite hijau.

## Non-goals
Tidak mengubah palet CSS, toggle, animasi panel, atau file lain di luar keempat file revert.
