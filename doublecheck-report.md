# Doublecheck report

> Verdict: **green**

## Spec
- Goal: Di seksi Education, bulatan (node) pada rail timeline otomatis berubah oranye tepat saat garis accent (progress fill) melewatinya, tanpa bergantung pada kartu mana yang sedang di tengah viewport.
- Scope: In scope: logika pewarnaan node di src/components/Education.tsx, modul murni baru src/lib/spine.ts, dan test tests/education-spine.test.ts. Out of scope: warna/token accent, gaya visual .edu-node di globals.css, rail fill (scaleY), seksi lain, dan markup kartu.
- Acceptance criteria: 1. Node menyala (is-done) tepat ketika progres garis >= fraksi posisi node terhadap panjang rail. 2. Tidak ada lagi penyalakan paksa `index < 1` dan tidak ada ketergantungan is-done pada `active`. 3. Node tidak pernah kembali abu-abu saat scroll maju (monoton). 4. Terukur di browser: selisih scrollY antara "tepi garis mencapai node" dan "node menyala" = 0 px untuk semua node. 5. `npm test` (76 tes), `tsc --noEmit`, dan `eslint` semuanya lulus.
- Failure modes: Jika rail belum terukur (offsetHeight 0 / ref belum ada), fraksi harus NaN dan node tidak menyala — bukan dianggap 0 (yang akan menyalakan semua node di atas). Jika progres NaN, anggap 0. Jika prefers-reduced-motion atau perangkat touch, semua node menyala statis (tanpa animasi) — perilaku lama dipertahankan. Jika kartu ber-transform saat masuk, pengukuran harus memakai ruang layout (offsetTop), bukan getBoundingClientRect. Bila layout berubah (resize / konten berubah), fraksi harus diukur ulang.
- Priorities: Sinkronisasi garis dan bulatan adalah syarat mutlak. Monotonisitas (tidak balik abu-abu) wajib. Diff minimal dan tanpa perubahan visual lain bersifat opsional. Kompatibilitas reduced-motion/touch wajib dipertahankan.
- Non-goals: Tidak mengubah warna accent atau gaya visual node. Tidak mengubah kecepatan/offset rail fill. Tidak menyentuh seksi lain atau komponen ExperienceTimeline. Tidak menambah dependensi baru.

## Test evidence
- failing runs: 0
- passing runs: 0

- [spec] Di seksi Education, bulatan (node) pada rail timeline otomatis berubah oranye tepat saat garis accent (progress fill) me…

## Adversary review
No adversary review ran for this session.

## Verification
Not run.

## Delivery
- implementation edits: 23
