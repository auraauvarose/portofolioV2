# Doublecheck spec

## Goal
Teks di dalam lingkaran lensa hover ikut memakai susunan dua kolom yang sama (kiri/kanan mengapit karakter), sehingga posisinya sejajar dengan judul di mode terang maupun gelap.

## Scope
Hanya blok teks lensa di src/components/Hero.tsx: pakai splitHalf untuk lensLine1/2 dan render dua kolom dengan kelas jarak + ukuran font identik dengan judul. Tidak mengubah judul, warna, animasi scale, atau posisi disc.

## Acceptance criteria
1) Markup lensa memakai `gap-[24vw] dark:md:gap-[36vw]` dan `text-[15vw] ... md:text-[13vw]` (string sama dengan judul). 2) `npx tsc --noEmit` exit 0, `npx eslint src/components/Hero.tsx` exit 0, `npm test` 521 pass 0 fail. 3) Screenshot paksa-tampil disc: huruf di disc segaris dengan judul di belakangnya, light maupun dark.

## Failure modes
Lensa memakai kata berbeda (SOFTWARE/ENGINEER) sehingga tidak bisa persis menimpa FULLSTACK/DEVELOPER — yang dituntut hanya susunan & posisi sama. Bila kelas jarak/ukuran beda sedikit, huruf disc akan bergeser dari judul.

## Priorities
Kesegarisan posisi > kata yang ditampilkan (tetap lensLine). Jangan ubah perilaku hover/scale atau warna disc.

## Non-goals
Bukan mengganti teks lensa, bukan menghapus lensa, bukan menyentuh globals.css, bukan mengubah breakpoint mobile.
