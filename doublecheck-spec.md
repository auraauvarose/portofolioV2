# Doublecheck spec

## Goal
Favicon/logo situs auraauvarose.my.id menampilkan foto profil baru (dari public/profile.webp), bukan logo lama.

## Scope
Hanya metadata `icons` di src/app/layout.tsx + satu aset gambar di public/. Tidak menyentuh og.png, Nav.tsx, JSON-LD, atau komponen lain.

## Acceptance criteria
1) `npm run typecheck` exit 0. 2) HTML hasil build memuat <link rel="icon" href="/profile-logo.png">. 3) URL favicon baru (bukan /icon.png) sehingga cache immutable 1 tahun lama tidak terpakai.

## Failure modes
- src/app/icon.png masih ada → Next auto-discovery menang dan tetap memakai logo lama (sudah dihapus). - URL sama seperti sebelumnya → browser tetap pakai cache immutable 1 tahun (diatasi dengan nama file baru). - Crop persegi memotong wajah → dicek visual sebelum build.

## Priorities
Favicon benar > cache busting > kerapian kode. Perubahan minimal diutamakan.

## Non-goals
Tidak mendesain ulang logo, tidak mengubah og.png, tidak menyentuh admin panel, tidak menambah dependency.

## Non-prs
