# Doublecheck spec

## Goal
Headline hero "FULLSTACK / DEVELOPER" tampil jauh lebih putih di dark mode (dari beige kusam #B7AB98/60 menjadi putih 90%).

## Scope
IN: satu nilai class warna teks dark-mode pada elemen h1 headline hero di src/components/Hero.tsx. OUT: lapisan bayangan oranye (__depth), overlay lensa, pita marquee, mode terang, ukuran/font/layout.

## Acceptance criteria
1) Di dark mode h1 headline hero memakai putih 90% (dark:text-white/90), bukan lagi #B7AB98/60. 2) Mode terang tidak berubah (tetap text-[#ffffff]/60). 3) Typecheck/lint proyek lolos tanpa error baru.

## Failure modes
(a) Ikut mengubah lapisan __depth oranye -> efek kedalaman 3D hilang (di luar scope). (b) Tidak sengaja mengubah nilai mode terang -> regresi di light mode. (c) Putih 90% membuat bayangan oranye di belakang tak terlihat — ini konsekuensi yang dipilih user, bukan bug. (d) Class Tailwind arbitrary salah tulis sehingga tidak ter-compile.

## Priorities
Prioritas: keputihan visual di dark mode > mempertahankan kesan tembus cahaya/blend dengan bayangan oranye. Opsional: penyesuaian mode terang.

## Non-goals
Tidak mengubah pita marquee, overlay lensa, font/ukuran/letter-spacing, layout, maupun lapisan bayangan oranye.
