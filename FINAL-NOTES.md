# Catatan Final — JANGAN DIUBAH

Dokumen ini mencatat keputusan final yang sudah disetujui user. Kalau AI/sesi lain
berencana mengubah hal di bawah ini, JANGAN. Kalau ragu, tanya user dulu.

Scope: `src/components/Hero.tsx`, `src/components/HomeClient.tsx`,
hapus-an `CustomCursor.tsx`.

---

## 1. Hero — Orange Lens Disc Cursor Reveal (FINAL)

File: `src/components/Hero.tsx` — efek hero sukses & disetujui. Jangan ganti.

**Perilaku yang harus dipertahankan:**

- Judul besar faded `FULLSTACK / DEVELOPER` (warna `text-black/20`,
  dark `text-[#B7AB98]/20`) tetap tampil.
- Eyebrow nama `APRIYANTO DWI HERLAMBANG` warna orange `text-[#EB5939]`.
- **Disc orange lensa 280px** (`bg-[#EB5939]`) ikut cursor, reveal
  `SOFTWARE / ENGINEER` (teks `text-black`) di dalamnya. Judul dalam disc
  **tetap di tengah viewport** (bukan ikut disc) — teknik lensa.
- Disc cuma muncul saat cursor di atas **teks hero** (container eyebrow+judul,
  handler `onMouseEnter/onMouseLeave` di situ). Keluar dari teks → disc
  animasi balik `scale(0)`, hilang total.
- `onMouseMove` di `<section>` update CSS var `--mx/--my` (client coords) —
  **jangan pakai state/re-render per frame** buat posisi disc.
- Default disc `scale(0)` + posisi offscreen → tidak muncul saat load.
- Disc `hidden lg:block` (mobile tanpa efek).

**Detail teknis (constraint):**

- Konstanta `DISC = 280`; transform disc =
  `translate(calc(var(--mx) - 140px), calc(var(--my) - 140px))`.
- Layer isi disc = `min-w-100vw min-h-100vh` +
  `translate(calc(-1 * var(--mx) + 140px), calc(-1 * var(--my) + 140px))`
  → ini yang bikin judul tetap di tengah. Jangan diubah rumusnya.
- Easing scale: `cubic-bezier(0.34,1.56,0.64,1)` (overshoot), `duration-500`.
- Disc punya `box-shadow` glow orange + highlight radial + `ring-white/20` —
  bagian "dibagusin" yang disetujui. Pertahankan.
- Spacer pill tak terlihat (`mt-4 md:mt-8`, `opacity-0`) di dalam disc wajib ada
  supaya judul dalam disc sejajar dengan judul base (margin HARUS sama dengan
  pill base `mt-4 md:mt-8`).

---

## 2. Custom Cursor Dihapus (FINAL)

- `src/components/CustomCursor.tsx` — **DILARANG dibuat ulang / dipakai lagi.**
- Import & render `<CustomCursor />` sudah dihapus dari `HomeClient.tsx`.
- User mau pakai **kursor mouse biasa** (native), bukan dot+ring custom.
- Jangan tambahkan `cursor: none` di `body` (itu bikin native cursor hilang).

---

## 3. Warna (FINAL)

- Accent orange = `#EB5939` (`--color-accent` di `globals.css`).
- Spotlight/disc orange pakai `bg-[#EB5939]` (bukan `amber`/`yellow`).
- Eyebrow base = `text-[#EB5939]`; teks dalam disc = `text-black`.

---

## Aturan umum

- Sesudah edit apa pun, wajib `pnpm build` / `npx next build` + `npx tsc --noEmit`
  — harus 0 error sebelum diklaim selesai.
- Jangan re-introduce `CustomCursor`, jangan ubah rumus transform lensa, jangan
  pindahkan handler `mouseenter/leave` dari container teks ke section.
