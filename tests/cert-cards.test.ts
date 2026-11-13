import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const CERT = src("src/components/Certifications.tsx");
const CAROUSEL = src("src/components/MobileCarousel.tsx");
const SH = src("src/components/SectionHeading.tsx");
const TECH = src("src/components/TechStack.tsx");

describe("Tech Stack — baris sisa halaman dipusatkan", () => {
  test("kartu selebar satu kolom; baris sisa di tengah, bukan col-start", () => {
    assert.match(
      TECH,
      /flex flex-wrap justify-center/,
      "baris kartu harus flex-wrap + justify-center",
    );
    assert.ok(
      !TECH.includes("lg:col-start-2"),
      "col-start-2 masih dipakai: kartu jatuh di kolom 2, bukan tengah",
    );
    assert.ok(
      TECH.includes("-3.75rem") && TECH.includes("-0.625rem"),
      "lebar kartu memakai kalkulasi 1/4 (desktop) dan 1/2 (HP)",
    );
  });
});

describe("Sertifikasi — kartu teks + pratinjau gambar saat hover", () => {
  test("kartu tidak lagi menaruh gambar sertifikat di dalam aliran teks", () => {
    assert.ok(
      !CERT.includes("aspect-[4/3]"),
      "kotak gambar aspect-[4/3] lama masih ada di kartu",
    );
  });

  test("gambar muncul sebagai overlay hover/focus", () => {
    assert.match(
      CERT,
      /group-hover:opacity-100 group-focus-visible:opacity-100/,
      "overlay gambar belum terikat ke hover/focus",
    );
    assert.ok(
      CERT.includes("absolute inset-0 z-10"),
      "overlay gambar belum menutupi seluruh kartu",
    );
  });

  test("kartu menampilkan teks kategori, tanggal, judul, deskripsi, dan footer issuer", () => {
    assert.ok(CERT.includes("uppercase tracking-widest text-accent"), "kategori");
    assert.ok(CERT.includes("line-clamp-4"), "deskripsi kartu perlu dibatasi");
    assert.ok(
      CERT.includes("mt-auto border-t border-white/10"),
      "footer issuer belum dipisah garis dan didorong ke bawah",
    );
  });

  test("overlay gambar memakai tombol VIEW CERTIFICATE", () => {
    assert.match(
      CERT,
      /View certificate/,
      "label tombol pratinjau belum ada",
    );
    assert.ok(
      CERT.includes("rounded-full bg-black/70"),
      "tombol pratinjau belum bergaya kapsul gelap",
    );
  });

  test("modal hanya gambar, tanpa blok teks", () => {
    const modal = CERT.slice(CERT.indexOf("createPortal"));
    assert.ok(
      modal.includes("max-h-[80vh]"),
      "gambar modal belum diperbesar ke 80vh",
    );
    assert.ok(
      !modal.includes("text-xl font-semibold"),
      "blok teks judul masih ada di dalam modal",
    );
  });
});

describe("Sertifikasi HP — navigasi geser tanpa tombol panah", () => {
  test("MobileCarousel punya prop opt-in swipeOnly", () => {
    assert.match(CAROUSEL, /swipeOnly\?: boolean/, "prop swipeOnly belum ada");
    assert.match(
      CAROUSEL,
      /total > 1 && !swipeOnly && \(/,
      "tombol panah HP belum tunduk pada swipeOnly",
    );
  });

  test("geser jempol tetap aktif saat panah disembunyikan", () => {
    assert.ok(
      CAROUSEL.includes("onTouchEnd") && CAROUSEL.includes("endDrag"),
      "handler swipe hilang",
    );
    assert.match(
      CAROUSEL,
      /onTouchCancel/,
      "swipe butuh onTouchCancel agar tidak nyangkut",
    );
  });

  test("hanya section sertifikasi yang memakai swipeOnly", () => {
    assert.ok(CERT.includes("swipeOnly"), "sertifikasi belum swipeOnly");
    for (const other of ["Gallery", "Projects"]) {
      assert.ok(
        !src(`src/components/${other}.tsx`).includes("swipeOnly"),
        `${other} ikut berubah — seharusnya opt-in`,
      );
    }
  });
});

describe("Heading section — varian rata tengah opt-in", () => {
  test("default tetap rata kiri", () => {
    assert.match(SH, /align = "left"/, "default align bukan left");
    assert.match(SH, /align === "center" &&/, "cabang center belum ada");
  });

  test("varian center menambah garis kiri yang melebar dari tengah", () => {
    assert.ok(
      SH.includes('transformOrigin: "right center"'),
      "garis kiri belum melebar dari arah tengah",
    );
  });

  test("hanya section 04 memakai align center", () => {
    assert.match(CERT, /index="04"\s+align="center"/, "section 04 belum center");
    for (const other of [
      "CommentsClient",
      "ExperienceTimeline",
      "Gallery",
      "Projects",
      "Testimonials",
    ]) {
      assert.ok(
        !src(`src/components/${other}.tsx`).includes('align="center"'),
        `${other} ikut center — seharusnya opt-in`,
      );
    }
  });
});
