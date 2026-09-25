# Doublecheck spec

## Goal
Beranda auraauvarose.my.id mengirim HTML berisi konten + H1 ke crawler, dan canonical/robots/sitemap menunjuk ke auraauvarose.my.id, tanpa menghilangkan satu pun animasi yang sudah ada.

## Scope
In: src/components/HomeClient.tsx (hapus early-return yang menyembunyikan seluruh halaman saat phase === "enter", ganti dengan overlay penutup) dan src/lib/site.ts (DEFAULT_SITE_URL → https://auraauvarose.my.id). Out: Google Search Console, DNS, redirect workers.dev, .env.local, vercel.app, file lain.

## Acceptance criteria
1) `npm run typecheck` lolos. 2) `npm run lint` lolos. 3) `npm test` lolos. 4) `npm run build` (atau cf:build) lolos. 5) HTML hasil build untuk "/" memuat tag <h1> dan teks nyata (bukan 36 karakter), bukan lagi hanya 2 div kosong. 6) canonical/og:url/robots/sitemap pada hasil build menunjuk ke https://auraauvarose.my.id. 7) Curtain loading tetap: greeting cycle, slide-down exit 0,7s, dan urutan visual hitam → greeting → Hero tidak berubah.

## Failure modes
Kalau halaman dirender saat "enter", ada risiko: (a) flash konten sebelum curtain tampil — dimitigasi overlay z-[99999] bg-ink; (b) error SSR karena window/document di luar useEffect — sudah diverifikasi nol hit; (c) animasi Hero/Lenis jalan sebelum curtain selesai — Hero memang sudah selalu dirender setelah mount, dan Lenis hanya membaca scroll, jadi tidak ada perubahan perilaku; (d) konten terlihat crawler tapi user melihat layar hitam lebih lama — durasi tidak berubah. Kalau build/typecheck gagal, revert file itu saja.

## Priorities
Prioritas: (1) animasi tidak boleh berubah/rusak, (2) HTML berisi konten, (3) canonical benar. Kalau ada konflik antara "HTML penuh" dan "animasi mulus", animasi menang.

## Non-goals
Bukan tujuan: peringkat 1 untuk kata "aura" (tidak mungkin untuk situs nol backlink), mendaftarkan Search Console, mengubah desain/tampilan, menambah section, mengubah durasi animasi, menyentuh .env.local atau secrets, redirect workers.dev.
