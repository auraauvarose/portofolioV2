# Doublecheck spec

## Goal
Di HP saja, ukuran judul hero dibuat sebesar referensi FULLLSTACK.png: teks mengisi lebar layar dan terpecah 4 baris (FULL/STACK/DEVEL/OPER), bukan 2 baris kecil seperti sekarang; desktop tidak berubah.

## Scope
Hanya src/components/Hero.tsx (markup blok mobile + ukuran font h1 mobile) dan tests/hero-mobile-title.test.ts. Desktop, CSS media query, dan aset lain di luar scope.

## Acceptance criteria
Screenshot 390x844: judul hero 4 baris besar (FULL/STACK/DEVEL/OPER), tiap baris mengisi lebar layar (≈ full-bleed). Full test suite 530 pass, tsc exit 0. Screenshot 1440x900 identik dengan baseline desktop (2 kolom + layer 3D oranye utuh).

## Failure modes
Kata terpotong keluar viewport di 390px → ukuran turun; judul menutupi eyebrow/scScroll; efek desktop berubah karena kelas md tertimpa; test warna h1 regresi.

## Priorities
1) ukuran/jumlah baris sesuai referensi 2) tidak ada kata terpotong 3) desktop tidak tersentuh 4) diff minimal.

## Non-goals
Tidak mengubah font, warna, animasi, tilt, lensa kursor, config.ts, atau layout desktop. Tidak membuat file baru selain memperbarui test yang ada.
