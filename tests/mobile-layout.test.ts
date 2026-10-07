import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

type Rule = { media: string; sel: string; body: string };

function rules(css: string): Rule[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Rule[] = [];
  const stack: ("at" | "rule")[] = [];
  const at: string[] = [];
  let buf = "";
  let cur: Rule | null = null;
  for (const ch of clean) {
    if (ch === "{") {
      const head = buf.trim();
      buf = "";
      if (head.startsWith("@")) {
        stack.push("at");
        at.push(head);
      } else {
        stack.push("rule");
        cur = { media: at.join(" "), sel: head, body: "" };
        out.push(cur);
      }
      continue;
    }
    if (ch === "}") {
      const kind = stack.pop();
      if (kind === "rule") {
        if (cur && buf.trim()) cur.body = buf.trim();
        cur = null;
      } else {
        at.pop();
      }
      buf = "";
      continue;
    }
    buf += ch;
  }
  return out;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const CSS = src("src/app/globals.css");
const RULES = rules(CSS);
const PHONE = /max-width:\s*767px/;
const COARSE = /hover:\s*none|pointer:\s*coarse/;

const find = (sel: string, media: RegExp) =>
  RULES.filter((r) => norm(r.sel) === norm(sel) && media.test(r.media));

const has = (sel: string, media: RegExp, decl: string) =>
  find(sel, media).some((r) => r.body.includes(decl));

const count = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

describe("Mobile — viewport, safe area, dan tempat mendaratnya anchor", () => {
  test("anchor section tidak mendarat di bawah header yang fixed", () => {
    assert.ok(
      has("section[id]", PHONE, "scroll-margin-top"),
      "section[id] butuh scroll-margin-top di layar HP",
    );
  });

  test("baris atas fixed menghormati safe-area atas dan samping", () => {
    const bar = find(".m-topbar", PHONE);
    assert.equal(bar.length, 1, ".m-topbar harus punya tepat satu aturan mobile");
    assert.match(bar[0].body, /padding-top:\s*max\([^)]*env\(safe-area-inset-top\)/);
    assert.match(bar[0].body, /padding-left:\s*max\([^)]*env\(safe-area-inset-left\)/);
    assert.match(bar[0].body, /padding-right:\s*max\([^)]*env\(safe-area-inset-right\)/);
  });

  test("tombol scroll menghormati safe-area bawah dan samping", () => {
    const btn = find(".m-scroll-btn", PHONE);
    assert.equal(btn.length, 1, ".m-scroll-btn harus punya tepat satu aturan mobile");
    assert.match(btn[0].body, /bottom:\s*max\([^;]*env\(safe-area-inset-bottom\)/);
    assert.match(btn[0].body, /right:\s*max\([^;]*env\(safe-area-inset-right\)/);
  });

  test("panel menu mobile punya padding safe-area di keempat sisi", () => {
    const panel = find(".mobile-menu-panel", PHONE);
    assert.equal(panel.length, 1);
    assert.match(panel[0].body, /padding-top:\s*max\([^;]*env\(safe-area-inset-top\)/);
    assert.match(panel[0].body, /padding-bottom:\s*max\([^;]*env\(safe-area-inset-bottom\)/);
    assert.match(panel[0].body, /padding-left:\s*max\([^;]*env\(safe-area-inset-left\)/);
    assert.match(panel[0].body, /padding-right:\s*max\([^;]*env\(safe-area-inset-right\)/);
  });

  test("iOS tidak menggelembungkan teks saat diputar", () => {
    assert.ok(
      RULES.some((r) => norm(r.sel) === "html" && r.body.includes("-webkit-text-size-adjust: 100%")),
      "html butuh -webkit-text-size-adjust: 100%",
    );
  });
});

describe("Mobile — keyboard iOS tidak memperbesar halaman", () => {
  test("kontrol form memakai font 16px di layar HP", () => {
    const f = find("input, textarea, select", PHONE);
    assert.equal(f.length, 1, "butuh aturan mobile untuk input/textarea/select");
    assert.ok(
      f[0].body.includes("font-size: 1rem"),
      "font di bawah 16px memicu auto-zoom iOS saat fokus",
    );
  });
});

describe("Mobile — biaya paint overlay tv-static", () => {
  test("noise tidak dianimasikan dan tidak diblend di perangkat sentuh", () => {
    const noise = find(".tv-static::before", COARSE);
    assert.equal(noise.length, 1, "butuh aturan coarse-pointer untuk .tv-static::before");
    assert.ok(noise[0].body.includes("animation: none !important"));
    assert.ok(noise[0].body.includes("mix-blend-mode: normal !important"));
  });

  test("scanline tidak dianimasikan di perangkat sentuh", () => {
    const scan = find(".tv-static::after", COARSE);
    assert.equal(scan.length, 1, "butuh aturan coarse-pointer untuk .tv-static::after");
    assert.ok(scan[0].body.includes("animation: none !important"));
  });
});

describe("Mobile — lantai ukuran teks 12px", () => {
  const files = [
    "src/components/Certifications.tsx",
    "src/components/ContactForm.tsx",
    "src/components/Education.tsx",
    "src/components/ExperienceTimeline.tsx",
    "src/components/Projects.tsx",
    "src/components/TechStack.tsx",
  ];

  for (const f of files) {
    test(`${f} tidak lagi memakai teks 10px/11px`, () => {
      const t = src(f);
      assert.ok(!t.includes("text-[10px]"), `${f} masih memakai text-[10px]`);
      assert.ok(!t.includes("text-[11px]"), `${f} masih memakai text-[11px]`);
    });
  }

  test("label form naik dari 10px", () => {
    const CF = src("src/components/ContactForm.tsx");
    assert.match(CF, /labelBase\s*=\s*"[^"]*text-xs/);
  });
});

describe("Mobile — target sentuh minimal 44px", () => {
  const needMinH = [
    ["src/components/About.tsx", "CTA unduh CV"],
    ["src/components/Certifications.tsx", "chip filter"],
    ["src/components/Contact.tsx", "tautan email dan sosial"],
    ["src/components/ContactForm.tsx", "tombol submit"],
    ["src/components/Gallery.tsx", "chip filter"],
    ["src/components/MusicPlayer.tsx", "tombol musik"],
    ["src/components/Projects.tsx", "chip filter dan tautan kartu"],
    ["src/components/TechStack.tsx", "chip teknologi dan filter"],
  ] as const;

  for (const [file, what] of needMinH) {
    test(`${file} — ${what} punya min-h-11 khusus HP`, () => {
      assert.ok(
        src(file).includes("max-md:min-h-11"),
        `${file} belum menaikkan ${what} ke 44px di HP`,
      );
    });
  }

  test("avatar Nav 44px di HP", () => {
    assert.ok(src("src/components/Nav.tsx").includes("max-md:h-11 max-md:w-11"));
  });

  test("kontrol menu mobile (EN/ID, tema) 44px di HP", () => {
    const NAV = src("src/components/Nav.tsx");
    assert.ok(
      count(NAV, "max-md:min-h-11") >= 3,
      "EN, ID, dan tombol tema semuanya butuh min-h-11",
    );
  });

  test("panah carousel 44px di HP", () => {
    assert.ok(
      src("src/components/MobileCarousel.tsx").includes("max-md:h-11 max-md:w-11"),
    );
  });

  test("tombol scroll punya lebar sentuh 44px di HP", () => {
    assert.ok(src("src/components/HomeClient.tsx").includes("max-md:min-w-11"));
  });

  test("tautan nama pemberi testimoni bisa ditekan", () => {
    assert.ok(src("src/components/Testimonials.tsx").includes("max-md:py-3"));
  });

  test("titik paginasi carousel tidak dipakai di HP", () => {
    const M = src("src/components/MobileCarousel.tsx");
    assert.match(
      M,
      /max-md:hidden/,
      "baris titik harus disembunyikan di HP: sepuluh titik 8px tidak bisa punya area sentuh 44px di lebar 360px",
    );
    assert.match(
      M,
      /m-rail/,
      "HP butuh penggaris progres sebagai ganti titik",
    );
  });

  test("carousel bisa digeser dengan jari", () => {
    const M = src("src/components/MobileCarousel.tsx");
    assert.ok(
      M.includes("onTouchStart") && M.includes("onTouchEnd"),
      "carousel di HP harus bisa digeser, bukan hanya ditekan panahnya",
    );
    assert.ok(
      M.includes("touch-action") || M.includes("touchAction"),
      "sumbu geser harus dibatasi supaya gulir vertikal tidak ikut tertahan",
    );
  });
});

describe("Mobile — tinggi viewport nyata", () => {
  test("hero memakai dvh di HP supaya tidak terpotong URL bar", () => {
    assert.ok(src("src/components/Hero.tsx").includes("max-md:h-[100dvh]"));
  });

  test("pembungkus sticky hero ikut memakai dvh", () => {
    assert.ok(src("src/components/HomeClient.tsx").includes("max-md:h-[100dvh]"));
  });
});

describe("Mobile — gutter dan ritme", () => {
  test("WhatIDo tidak lagi menempel tepi dengan gutter 16px", () => {
    const W = src("src/components/WhatIDo.tsx");
    assert.ok(!W.includes("px-4 pt-2"), "gutter WhatIDo masih 16px");
    assert.match(W, /px-6 pt-2/);
  });

  test("judul WhatIDo tidak lagi 14vw di HP", () => {
    const W = src("src/components/WhatIDo.tsx");
    assert.ok(!W.includes("text-[14vw]"), "judul WhatIDo masih 14vw");
    assert.match(W, /text-\[clamp\(/, "judul WhatIDo butuh clamp agar tidak ekstrem");
  });

  test("semua section memakai gutter 24px yang sama di HP", () => {
    const W = src("src/components/WhatIDo.tsx");
    assert.ok(!W.includes("px-4 pt-2"), "gutter WhatIDo masih 16px");
    assert.ok(W.includes("px-6 pt-2"));

    const T = src("src/components/TechStack.tsx");
    assert.ok(!T.includes("max-md:px-4"), "gutter TechStack masih 16px");
    assert.match(T, /className="relative px-6 py-24 max-md:py-16/, "section TechStack butuh gutter 24px");
    assert.ok(T.includes("-mx-6") && T.includes("px-6 pb-0.5"));
  });

  test("baris status TechStack tidak terpotong di HP tersempit", () => {
    // Diukur: pada 320px baris ini butuh 332px di dalam kotak 272px, dan
    // pemotongnya adalah `overflow-x: clip` milik <main>, jadi teksnya hilang
    // tanpa bisa digeser. Mengurangi tracking tidak cukup (butuh <=0.055em),
    // jadi satu-satunya perbaikan jujur adalah membiarkannya membungkus.
    const T = src("src/components/TechStack.tsx");
    const row =
      T.split("\n").find((l) => l.includes("font-data text-xs uppercase tracking-[0.24em]")) ?? "";
    assert.ok(row.length > 0, "baris status TechStack tidak ditemukan");
    assert.ok(
      row.includes("max-md:flex-wrap"),
      `baris status TechStack meluber dan terpotong di HP tersempit: ${row.trim()}`,
    );
  });

  test("timeline pengalaman punya rel di HP, bukan hanya di desktop", () => {
    const E = src("src/components/ExperienceTimeline.tsx");
    const spine = E.split("\n").find((l) => l.includes("h-[calc(100%-1rem)]")) ?? "";
    assert.ok(spine.length > 0, "garis timeline tidak ditemukan");
    assert.ok(
      !spine.includes("hidden"),
      `garis timeline masih disembunyikan di HP: ${spine.trim()}`,
    );
  });

  test("judul section naik skala di HP supaya terbaca sebagai pernyataan", () => {
    for (const sel of [".sh h2", "#work h2.text-bevellier"]) {
      const r = find(sel, PHONE);
      assert.equal(r.length, 1, `${sel} butuh tepat satu aturan mobile`);
      assert.match(
        r[0].body,
        /font-size:\s*clamp\(3\.25rem,\s*16vw,\s*4\.5rem\)/,
        `${sel} belum naik skala`,
      );
      assert.match(r[0].body, /line-height:\s*0\.94/, `${sel} belum dirapatkan`);
    }
  });
});

describe("Mobile — penanda kelas kait CSS", () => {
  test("Nav memasang m-topbar di kedua baris fixed", () => {
    assert.equal(count(src("src/components/Nav.tsx"), "m-topbar"), 2);
  });

  test("tombol scroll memasang m-scroll-btn", () => {
    assert.ok(src("src/components/HomeClient.tsx").includes("m-scroll-btn"));
  });
});

// Aksen ekspresif: di HP judul tidak lagi sekadar "muat", tapi dipakai sebagai
// elemen grafis. Angka batasnya diukur, bukan ditebak — kata terpanjang di
// kedua bahasa (Indonesia "Pengunjung" = 4.098em) masih muat sampai 76px di
// lebar 360px, jadi seluruh skala di bawah ini punya sisa ruang.
describe("Mobile — aksen ekspresif", () => {
  test("judul hero memakai ruang yang benar-benar tersedia, bukan hanya yang sekarang", () => {
    const H = src("src/components/Hero.tsx");
    assert.equal(
      count(H, "text-[clamp(3rem,18vw,6rem)]"),
      2,
      "judul hero dan salinan depth-nya harus sama-sama naik skala",
    );
  });

  test("judul WhatIDo naik skala supaya terbaca sebagai pernyataan", () => {
    const W = src("src/components/WhatIDo.tsx");
    assert.ok(
      W.includes("text-[clamp(3rem,16vw,4.5rem)]"),
      "judul WhatIDo belum naik skala di HP",
    );
  });

  test("judul Contact naik skala di HP", () => {
    const C = src("src/components/Contact.tsx");
    assert.ok(
      C.includes("text-[clamp(3rem,15vw,9rem)]"),
      "judul Contact belum naik skala di HP",
    );
  });

  test("label marquee ikut naik di HP", () => {
    const M = src("src/components/Marquee.tsx");
    assert.ok(
      M.includes("max-md:text-6xl"),
      "label marquee belum naik di HP",
    );
  });

  test("nomor section dipakai sebagai aksen grafis, bukan label kecil", () => {
    const r = find(".sh-index", PHONE);
    assert.equal(r.length, 1, ".sh-index butuh tepat satu aturan mobile");
    assert.match(r[0].body, /font-size:\s*1\.75rem/, "nomor section belum jadi aksen");
    assert.match(r[0].body, /line-height:\s*1/, "nomor section butuh line-height rapat");
  });
});
