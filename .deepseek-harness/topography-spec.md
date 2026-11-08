# Doublecheck spec

## Goal
Ganti latar titik homepage dengan kontur topografi seperti referensi yang melengkung mengikuti kursor tanpa mengubah isi atau layout.

## Scope
src/components/SiteConstellation.tsx sebagai satu owner latar yang sudah dipasang HomeClient; src/app/globals.css untuk warna/blending dan mengganti pola titik; src/components/TechStack.tsx hanya pola titik lokal; tests/site-constellation.test.ts dan tests/site-backdrop.test.ts untuk kontrak baru. HomeClient, Hero, konten, struktur section, API, dan dependency di luar lingkup.

## Acceptance criteria
Satu canvas kontur menutup viewport dan terlihat sepanjang homepage. Pola memakai garis topografi tipis, netral, berkontras rendah; bentuk berubah di dekat kursor dan berevolusi pelan saat diam. Titik global serta titik TechStack tidak lagi dirender. Tema terang/gelap, gambar Hero, teks, klik, dan struktur section tetap. Tes terarah untuk medan kontur dan lifecycle serta tsc --noEmit harus exit 0; tidak menjalankan build atau deploy.

## Failure modes
Canvas/context tidak tersedia: efek dilewati, konten tetap tampil. Perangkat touch atau prefers-reduced-motion: pola statis tanpa animasi kursor. Tab tersembunyi: requestAnimationFrame dihentikan. Resize memperbarui ukuran canvas; pergantian tema memperbarui warna. Unmount membatalkan frame dan melepas listener/observer.

## Priorities
Kelancaran, keterbacaan, aksesibilitas, dan diff owner-local lebih penting daripada kesamaan pixel-identik. Gunakan Canvas native dan dependency yang sudah ada; animasi dekoratif boleh statis di HP/reduced-motion.

## Non-goals
Tidak mengganti gambar Hero, tidak mengubah layout/section, tidak menambah dependency, efek klik/ripple, menu pengaturan, server baru, build, atau deploy; tidak menjanjikan salinan pixel-identik.
