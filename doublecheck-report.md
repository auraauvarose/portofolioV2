# Doublecheck report

> Verdict: **green**

## Spec
- Goal: Latar belakang seluruh section homepage (9 section) memakai satu pola konstelasi yang sama — garis melengkung + node yang menyala oranye mengikuti scroll global — menggantikan garis lurus扶 seperti akar yang sekarang hanya ada di TechStack.
- Scope: IN: (1) file baru src/components/SiteConstellation.tsx; (2) blok CSS konstelasi + @property --sc-node/--sc-link di src/app/globals.css; (3) penyisipan &lt;SiteConstellation seed={N} /&gt; + kelas relative pada 9 section di About, WhatIDo, Education, ExperienceTimeline, Certifications, TechStack, Showcase, Testimonials, Contact; (4) TechStack.tsx: SVG konstelasi inline & CSS .ts-link/.ts-node dihapus, ganti pakai komponen bersama; (5) tests/tech-stack-section.test.ts: 3 assertion yang menunjuk lokasi konstelasi lama diarahkan ke file SiteConstellation.tsx. OUT: Halaman /admin, /komentar, /work/[slug]; komponen Marquee, Hero, Nav, Footer; data di src/lib/config.ts; tests selain tech-stack-section dan site-backdrop; dependency baru.
- Acceptance criteria: 1. src/components/SiteConstellation.tsx ada, menerima prop seed opsional, dan merender SVG aria-hidden + pointer-events-none sebagai lapisan latar absolute inset-0. 2. Garis konstelasi memakai path Q (bezier) sehingga tidak lagi membentuk sudut tajam seperti akar/dahan. 3. Node dirender sebagai elemen non-SVG berposisi persen sehingga tetap bulat pada section lebar (viewBox 100x100 yang di-stretch tidak membuat lingkaran jadi ellips). 4. 9 section homepage memakai komponen itu, masing-masing dengan seed berbeda sehingga polanya tidak identik berulang. 5. Warna node dan garis ditransisikan dari abu-abu ke var(--color-accent) lewat state html.is-scrolled yang sudah ada, dengan transition di CSS. 6. @property --sc-node dan --sc-link terdaftar dengan syntax "<color>" agar bisa di-transition. 7. Animasi garis tumbuh + denyut node berhenti saat section keluar viewport (IntersectionObserver) dan dimatikan penuh pada prefers-reduced-motion, sementara perpindahan warna oranye tetap jalan. 8. Konten section tetap di atas layer konstelasi dan tidak berubah penampilannya. 9. npm run typecheck exit 0, npm run lint exit 0, dan seluruh test yang ada tetap hijau.
- Failure modes: Node memblokir klik/hover → pointer-events-none pada layer. Layer konstelasi menutupi teks → konten section tetap position: relative dan berada setelah konstelasi di DOM. Pola terlihat sama persis di semua section → seed berbeda per section. Animasi battery drain saat section di luar layar → IntersectionObserver pausing. Node jadi ellips pada section lebar → node pakai div persentase, bukan &lt;circle&gt;. Warna oranye hard-cut → transition --sc-node/--sc-link + @property &lt;color&gt;. Test lama gagal karena konstelasi pindah file → assertion diarahkan ke file baru, bukan dihapus. prefers-reduced-motion diabaikan → blok @media mematikan grow dan denyut.
- Priorities: 1) Keterbacaan teks di atas pola — daher garis tipis pucat dan node kecil, bukan elemen dominan. 2) Konsistensi: satu komponen untuk semua section, bukan 9 salinan. 3) Animasi neuek keluar viewport dihentikan demi performa. 4) Seed variation_varia adalah bonus, bukan keharusan — kalau trigonometri generating bermasalah, seed bisa sementara dibuang.
- Non-goals: Tidak mengubah layout, spacing, tipografi, warna teks, atau isi card di section mana pun. Tidak menyentuh halaman /admin, /komentar, /work/[slug]. Tidak menambah dependency baru. Tidak mengubah pola titik 26px global yang sudah ada di body. Tidak menambah test baru di luar yang perlu diarahkan ulang. Tidak mengubah .ts-bg (pola titik) milik TechStack.

## Test evidence
- failing runs: 0
- passing runs: 2

- [spec] Latar belakang seluruh section homepage (9 section) memakai satu pola konstelasi yang sama — garis melengkung + node yan…
- [green] cd /home/auraauvarose/portofolioV2 && npm test 2>&1 | grep -E "^# (tests|pass|fail)|^✖" | head -30
- [green] cd /home/auraauvarose/portofolioV2 && npm test 2>&1 | tail -30

## Adversary review
No adversary review ran for this session.

## Verification
Not run.

## Delivery
- implementation edits: 15
