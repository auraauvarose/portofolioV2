import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  techStack,
  techDescriptions,
  techLinks,
} from "../src/lib/config.ts";

const here = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => readFileSync(resolve(here, "..", p), "utf8");

const TECH = src("src/components/TechStack.tsx");
const CONFIG = src("src/lib/config.ts");

const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const CODE = stripComments(TECH);

const SC_CODE = stripComments(src("src/components/SiteConstellation.tsx"));

/* Isolasi blok CSS lokal komponen: dari .ts-bg sampai penutup terakhir. */
function cssBlock(selector: string): string | null {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|[}\\n])\\s*${esc}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(CODE))) out.push(m[1]);
  return out.length ? out.join("\n") : null;
}

const items = techStack.categories.flatMap((cat) => cat.items);

describe("A. stage scroll-pinned", () => {
  test("track 460vh desktop, 240vh mobile (pin ±3240px)", () => {
    assert.match(CODE, /h-\[460vh\]/, "track desktop 460vh agar scroll lebih lambat");
    assert.match(CODE, /max-md:h-\[240vh\]/, "track mobile dipendekkan agar lebih ringan");
    const desktop = Number(CODE.match(/h-\[(\d+)vh\]/)?.[1] ?? 0);
    const mobile = Number(CODE.match(/max-md:h-\[(\d+)vh\]/)?.[1] ?? 0);
    assert.strictEqual(desktop, 460, "track desktop harus 460vh");
    assert.strictEqual(mobile, 240, "track mobile harus 240vh");
  });

  test("satu perpindahan halaman di .22–.46, spring diperlunak", () => {
    const move = CODE.match(/const PAGE_MOVE = \[([\d.]+), ([\d.]+)\] as const/);
    assert.ok(move, "PAGE_MOVE harus literal angka");
    const [, a, b] = move;
    assert.ok(
      Number(a) >= 0.2 && Number(b) <= 0.5,
      `jendela geser halaman ${a}–${b} di luar p .2–.5`,
    );
    const spring = CODE.match(/stiffness: (\d+),\s*damping: (\d+)/);
    assert.ok(spring, "SPRING harus literal angka");
    assert.ok(Number(spring[1]) < 150, `stiffness harus turun dari 150: ${spring[1]}`);
    assert.ok(Number(spring[2]) > 30, `damping harus naik dari 30: ${spring[2]}`);
  });

  test("stage sticky 100svh di dalam track", () => {
    const stage = CODE.match(/className="[^"]*\bsticky\b[^"]*"/)?.[0] ?? "";
    assert.ok(stage, "tidak ada stage sticky");
    assert.match(stage, /\btop-0\b/);
    assert.match(stage, /h-\[100svh\]/, "stage harus setinggi viewport dinamis");
    assert.match(stage, /overflow-hidden/, "isi rail tidak boleh meluber ke section lain");
  });

  test("track & section tidak mematikan sticky lewat overflow/transform", () => {
    const section = CODE.match(/<section className="[^"]*"/)?.[0] ?? "";
    const track = CODE.match(/className="ts-track[^"]*"/)?.[0] ?? "";
    for (const [name, tag] of [
      ["section", section],
      ["track", track],
    ] as const) {
      assert.doesNotMatch(
        tag,
        /overflow-hidden|overflow-clip|\btransform\b|contain-|will-change/,
        `${name} memakai properti yang mematikan position: sticky: ${tag}`,
      );
    }
  });
});

describe("B. layar judul", () => {
  test("kicker: nomor bab sekali + label dari config, kecil & uppercase", () => {
    assert.match(CODE, /const CHAPTER = "05"/, "nomor bab harus satu sumber");
    assert.equal(
      TECH.match(/"05"/g)?.length,
      1,
      "angka 05 tidak boleh diduplikasi sebagai literal lain",
    );
    assert.match(CODE, /t\(techStack\.kicker\)/, "label kicker dari config");
    const kicker = CODE.match(/className="[^"]*tracking-\[0\.28em\][^"]*"/)?.[0] ?? "";
    assert.match(kicker, /uppercase/);
    assert.match(kicker, /text-xs/, "kicker maksimal 0.875rem");
  });

  test("judul 'Tech Stack' besar & terpusat, dua baris", () => {
    assert.match(
      CODE,
      /text-\[clamp\(3rem,17vw,4\.75rem\)\] md:text-\[clamp\(4rem,11vw,12rem\)\]/,
      "ukuran judul harus clamp 4rem..12rem di desktop",
    );
    assert.match(CODE, /words\.map/, "judul dipecah per kata untuk dua baris");
    assert.match(CODE, /className="block"/, "tiap baris judul adalah block (2 baris)");
  });

  test("heading asli tetap a11y: aria-label utuh + kata aria-hidden", () => {
    assert.match(CODE, /<motion\.h2[\s\S]{0,120}aria-label=\{heading\}/);
    assert.match(
      CODE,
      /<span key=\{`\$\{word\}-\$\{wi\}`\} aria-hidden className="block">/,
      "kata pembentuk judul harus aria-hidden agar nama aksesibel tetap utuh",
    );
  });

  test("posisi tengah diukur runtime, bukan hard-code", () => {
    assert.match(
      CODE,
      /\(stageW - head\.offsetWidth\) \/ 2 - head\.offsetLeft/,
      "x0 harus hasil ukur stage vs head",
    );
    assert.match(
      CODE,
      /\(stageH - head\.offsetHeight\) \/ 2 - head\.offsetTop/,
      "y0 harus hasil ukur stage vs head",
    );
    assert.match(CODE, /document\.fonts\?\.ready\.then\(measure\)/, "ukur ulang setelah font swap");
    assert.match(CODE, /new ResizeObserver\(measure\)/, "ukur ulang saat ukuran berubah");
  });
});

describe("C. animasi masuk satu huruf digerakkan scroll", () => {
  test("hanya satu huruf (huruf terakhir) dibungkus .ts-k", () => {
    assert.equal(
      (CODE.match(/className="ts-k"/g) ?? []).length,
      1,
      "hanya satu huruf judul yang punya mask sendiri",
    );
    assert.match(CODE, /const lastChar = lastWord\.slice\(-1\)/, "huruf yang dianimasikan = huruf terakhir");
    assert.match(CODE, /className="ts-k-base"/);
    assert.match(CODE, /className="ts-k-accent"/);
  });

  test("nilai huruf dari scrollYProgress/spring, bukan hover", () => {
    assert.match(CODE, /useScroll\(\{/, "progress harus dari useScroll");
    assert.match(CODE, /offset: \["start start", "end end"\]/, "pin penuh sepanjang track");
    assert.match(CODE, /useSpring\(scrollYProgress, SPRING\)/);
    assert.match(
      CODE,
      /const keyY = useTransform\(\s*sp,\s*\[0, KEY_IN, 0\.085, KEY_END, 1\],\s*\["102%", "102%", "-8%", "0%", "0%"\]/,
      "huruf naik 102% -> -8% -> 0% mengikuti progress",
    );
    assert.match(CODE, /style=\{\{ y: keyY \}\}/, "nilai itu dipakai sebagai transform huruf");
    assert.doesNotMatch(CODE, /whileHover/, "animasi huruf tidak boleh hover-driven");
  });
});

describe("D. rail skill horizontal: 3 halaman grid", () => {
  test("translateX rail = (jumlah halaman − 1) × lebar stage, bukan shift 5400px", () => {
    assert.match(
      CODE,
      /const railX = useTransform\(\s*sp,\s*\[0, PAGE_MOVE\[0\], PAGE_MOVE\[1\], 1\],\s*\[0, 0, -metrics\.pageW, -metrics\.pageW\]/,
      "rail bergeser 1× lebar stage (2 halaman)",
    );
    assert.match(
      CODE,
      /pageW: Math\.round\(stageW\)/,
      "lebar halaman = lebar stage, bukan scrollWidth rail",
    );
    assert.doesNotMatch(CODE, /metrics\.shift|scrollWidth/, "tidak ada lagi geseran 5400px");
  });

  test("konten dipecah 8 kartu per halaman → 2 halaman", () => {
    assert.match(CODE, /const PAGE_SIZE = 8/, "8 kartu per halaman (4 × 2)");
    assert.match(CODE, /for \(let i = 0; i < flatItems\.length; i \+= PAGE_SIZE\)/);
    assert.match(CODE, /flatItems\.slice\(i, i \+ PAGE_SIZE\)/);
    assert.match(CODE, /pages\.map\(\(page, pi\)/, "setiap halaman dirender");
    assert.match(
      CODE,
      /className="ts-page flex w-full shrink-0 flex-col justify-center px-5 lg:px-12"/,
      "halaman adalah slide selebar stage",
    );
    assert.match(CODE, /flex flex-wrap justify-center gap-2\.5 lg:gap-5/, "baris sisa dipusatkan");
    assert.match(
      CODE,
      /w-\[calc\(\(100%-0\.625rem\)\/2\)\] lg:w-\[calc\(\(100%-3\.75rem\)\/4\)\]/,
      "kartu selebar 1/2 (mobile) dan 1/4 kolom (desktop)",
    );
    assert.doesNotMatch(CODE, /pi === lastPage && page\.length === 1/, "cabang kartu tunggal mati");
    for (const banned of [
      "teknologi",
      "disiplin",
      "Gulir untuk menjelajah",
      "UI.technologies",
      "UI.disciplines",
      "lg:col-span-2 lg:col-start-3",
    ]) {
      assert.ok(!CODE.includes(banned), `meta bar harus hilang total: ${banned}`);
    }
  });

  test("indikator 2 halaman (titik) digerakkan progress", () => {
    for (const dot of ["dot1Opacity", "dot2Opacity"]) {
      assert.match(CODE, new RegExp(`const ${dot} = useTransform\\(`), `${dot} hilang`);
      assert.match(
        CODE,
        new RegExp(`style=\\{\\{ opacity: ${dot} \\}\\}`),
        `${dot} tidak dipakai di titik halaman`,
      );
    }
    assert.doesNotMatch(CODE, /dot3Opacity/, "titik halaman ketiga sudah tidak ada");
    assert.match(CODE, /<div aria-hidden className="mt-4 flex gap-2">/);
    assert.match(CODE, /h-1\.5 w-1\.5 rounded-full bg-accent/);
  });

  test("semua item dari techStack.categories dirender, tidak ada daftar hard-code", () => {
    assert.match(CODE, /flatMap\(\(cat, ci\)/, "kategori diiterasi dari data");
    assert.match(CODE, /cat\.items\.map\(\(label, ii\)/, "item diiterasi dari data");
    assert.match(CODE, /useMemo\(\s*\(\) => techStack\.categories/);
    for (const name of ["React", "TypeScript", "PostgreSQL", "Docker"]) {
      assert.ok(!CODE.includes(`"${name}"`), `nama teknologi tidak boleh hard-code: ${name}`);
    }
  });

  test("kartu besar: ikon + nama + deskripsi tampil tanpa hover", () => {
    const card = CODE.match(/const CARD =\s*\n?\s*"([^"]*)"/)?.[1] ?? "";
    assert.match(card, /h-\[clamp\(7rem,16svh,11rem\)\]/, "tinggi kartu mobile");
    assert.match(card, /lg:h-\[clamp\(13rem,30svh,17rem\)\]/, "tinggi kartu desktop");
    assert.match(card, /\bw-full\b/, "lebar kartu mengikuti grid");
    assert.match(card, /shadow-none md:shadow-/, "bayangan berat hanya di desktop");
    assert.match(CODE, /techIcon\(label,/, "ikon per item");
    assert.match(CODE, /\{label\}/, "nama item dirender");
    assert.match(CODE, /t\(description\)/, "deskripsi dirender langsung, bukan hover-only");
    assert.match(CODE, /lg:line-clamp-3/, "deskripsi dibatasi 3 baris di desktop");
  });

  test("link eksternal hanya untuk item yang punya entri techLinks", () => {
    assert.match(CODE, /const link = techLinks\[label\]/);
    const anchor = CODE.match(/<a href=\{link\}[\s\S]{0,120}/)?.[0] ?? "";
    assert.match(anchor, /target="_blank"/);
    assert.match(anchor, /rel="noreferrer"/);
    assert.match(anchor, /className=\{CARD_BODY\}/, "gaya kartu dipakai bersama isi non-link");
    assert.match(
      CODE.match(/const CARD_BODY =[\s\S]*?;/)?.[0] ?? "",
      /max-md:min-h-11/,
      "tautan kartu tetap 44px di HP",
    );
  });

  test("rail bisa difokus: kartu di luar layar digeser ke tengah saat fokus", () => {
    assert.match(CODE, /onFocusCapture=\{onRailFocus\}/);
    assert.match(CODE, /getLenis\(\)/, "pakai Lenis yang sudah ada");
    assert.match(CODE, /scrollTo\(top, \{ immediate: true \}\)/);
    assert.match(
      CODE,
      /\.matches\(":focus-visible"\)/,
      "klik/tap tidak boleh menggeser halaman sebelum link aktif",
    );
    assert.match(
      CODE,
      /cardRect\.left >= stageRect\.left && cardRect\.right <= stageRect\.right/,
      "kartu yang sudah utuh terlihat tidak perlu digeser",
    );
    assert.match(
      CODE,
      /window\.innerHeight \|\| document\.documentElement\.clientHeight/,
      "rentang pin memakai tinggi viewport, bukan tinggi stage 100svh",
    );
    assert.doesNotMatch(CODE, /track\.offsetHeight - stage\.offsetHeight/);
  });
});

describe("E. rewind ke layar judul lalu lepas pin", () => {
  test("rail keluar di akhir: opacity 1 -> 0", () => {
    assert.match(
      CODE,
      /const railOpacity = useTransform\(\s*sp,\s*\[0, RAIL_IN\[0\], RAIL_IN\[1\], RAIL_OUT\[0\], RAIL_OUT\[1\], 1\],\s*\[0, 0, 1, 1, 0, 0\]/,
      "rail harus memudar di fase rewind",
    );
  });

  test("judul pulih utuh: scale & posisi kembali ke nilai awal", () => {
    assert.match(
      CODE,
      /const titleScale = useTransform\([\s\S]*?\[1, 1, 0\.34, 0\.34, 1, 1\]/,
      "scale judul harus kembali ke 1 di ujung track",
    );
    for (const axis of ["titleX", "titleY"]) {
      assert.match(
        CODE,
        new RegExp(
          `const ${axis} = useTransform\\([\\s\\S]*?\\[metrics\\.(x0|y0), metrics\\.(x0|y0), 0, 0, metrics\\.(x0|y0), metrics\\.(x0|y0)\\]`,
        ),
        `${axis} harus kembali ke titik awal`,
      );
    }
    assert.match(
      CODE,
      /const titleOpacity = useTransform\([\s\S]*?\[1, 1, 0, 0, 1, 1\]/,
      "opacity judul kembali terlihat",
    );
  });

  test("tidak ada lompatan saat lepas pin (state akhir konstan)", () => {
    const outputsOf = (name: string) => {
      const start = CODE.indexOf(`const ${name} = useTransform(`);
      assert.ok(start >= 0, `transform ${name} tidak ditemukan`);
      const block = CODE.slice(start, CODE.indexOf(");", start));
      const arrays = [...block.matchAll(/\[([^[\]]*)\]/g)].map((m) => m[1]);
      const last = arrays[arrays.length - 1] ?? "";
      return last.split(",").map((v) => v.trim());
    };
    /* railX/railY memang berakhir di posisi keluar (rail sudah opacity 0);
       yang wajib sama adalah nilai yang terlihat dan judul yang dipulihkan. */
    for (const name of ["railOpacity", "titleScale", "titleX", "titleY", "titleOpacity"]) {
      const outputs = outputsOf(name);
      assert.ok(outputs.length > 1, `output range ${name} tidak terbaca`);
      assert.equal(
        outputs[0],
        outputs[outputs.length - 1],
        `${name} berubah nilai antara awal dan akhir track → akan melompat saat unpin`,
      );
    }
    const railXOut = outputsOf("railX");
    assert.equal(
      railXOut[railXOut.length - 1],
      "-metrics.pageW",
      "rail tetap di halaman 2 saat rewind (tidak snap balik)",
    );
    const railOpacityOut = outputsOf("railOpacity");
    assert.equal(railOpacityOut[railOpacityOut.length - 1], "0", "rail tak terlihat saat unpin");
  });
});

describe("F. fallback reduced-motion & tanpa JS", () => {
  test("prefers-reduced-motion melepas pin dan menampilkan versi statis", () => {
    const fallback =
      CODE.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/)?.[0] ?? "";
    assert.ok(fallback, "blok reduced-motion tidak ditemukan");
    assert.match(fallback, /\.ts-track\s*\{\s*height:\s*auto/);
    assert.match(fallback, /\.ts-dyn\s*\{\s*display:\s*none/);
    assert.match(fallback, /\.ts-static\s*\{\s*display:\s*block/);
  });

  test("tanpa JS (html:not(.js)) memakai fallback statis yang sama", () => {
    for (const sel of [".ts-track", ".ts-dyn", ".ts-static"]) {
      assert.match(
        CODE,
        new RegExp(`:where\\(html:not\\(\\.js\\)\\)\\s*${sel.replace(".", "\\.")}\\s*\\{`),
        `fallback no-JS untuk ${sel} hilang`,
      );
    }
  });

  test("fallback statis memuat semua item + deskripsi + link", () => {
    const staticBlock =
      CODE.match(/className="ts-static hidden[\s\S]*?\n        <\/div>\n      <\/div>\n    <\/section>/)?.[0] ?? "";
    assert.ok(staticBlock, "blok .ts-static tidak ditemukan");
    assert.match(staticBlock, /categories\.map\(/, "semua kategori dirender");
    assert.match(staticBlock, /cat\.items\.map\(/, "semua item dirender");
    assert.match(staticBlock, /t\(description\)/);
    assert.match(staticBlock, /href=\{link\}/);
    assert.match(staticBlock, /<h2/, "judul tetap heading asli saat tanpa JS");
  });
});

describe("G. data tetap dari sumber yang sama", () => {
  test("kategori dibaca dari useSiteContent agar override dashboard tetap jalan", () => {
    assert.match(CODE, /useSiteContent\(\)/);
    assert.match(CODE, /\{ techStack \} = useSiteContent\(\)/);
  });

  test("16 item punya deskripsi & link di config", () => {
    assert.equal(items.length, 16, "jumlah item techStack berubah");
    const described = items.filter(
      (item) => techDescriptions[item as keyof typeof techDescriptions],
    );
    const linked = items.filter((item) => techLinks[item as keyof typeof techLinks]);
    assert.equal(described.length, 16, "setiap item butuh deskripsi");
    assert.equal(linked.length, 16, "setiap item butuh link");
  });

  test("techDescriptions & techLinks tetap diekspor lib/config", () => {
    assert.match(CODE, /import \{ techDescriptions, techLinks \} from "@\/lib\/config"/);
    assert.match(CONFIG, /export const techDescriptions/);
    assert.match(CONFIG, /export const techLinks/);
  });
});

describe("H. kontrak lama yang masih berlaku", () => {
  test("section memakai gutter & padding yang sama", () => {
    assert.match(CODE, /className="relative px-6 py-24 max-md:py-16/);
    assert.ok(TECH.includes("-mx-6") && TECH.includes("px-6 pb-0.5"));
  });

  test("baris status membungkus di HP tersempit", () => {
    const row =
      TECH.split("\n").find((l) => l.includes("font-data text-xs uppercase tracking-[0.24em]")) ?? "";
    assert.ok(row.length > 0, "baris status tidak ditemukan");
    assert.ok(row.includes("max-md:flex-wrap"), `baris status meluber: ${row.trim()}`);
  });

  test("latar .ts-bg tetap kontur tanpa gambar", () => {
    assert.match(TECH, /\.ts-bg\s*\{\s*background-image:\s*none/);
  });

  test("target sentuh 44px & larangan markup lama", () => {
    assert.ok(TECH.includes("max-md:min-h-11"));
    for (const banned of [
      "text-[10px]",
      "text-[11px]",
      "pointer: coarse",
      "md:hidden",
      "TechStackMobile",
      "TechStackMindMap",
      "requestAnimationFrame",
      "border-radius: 2px",
    ]) {
      assert.ok(!TECH.includes(banned), `markup terlarang muncul lagi: ${banned}`);
    }
  });

  test("animasi hanya transform/opacity, tanpa properti layout", () => {
    const styles = [...CODE.matchAll(/style=\{\{([\s\S]*?)\}\}/g)].map((m) => m[1]);
    assert.ok(styles.length >= 5, "tidak ada style animasi yang ditemukan");
    /* visibility hanya dipakai sebagai gerbang anti-flash sebelum ukur;
       ia tidak memicu layout dan bukan bagian animasi. */
    const allowed = new Set([
      "x",
      "y",
      "opacity",
      "scale",
      "scaleX",
      "transformOrigin",
      "visibility",
    ]);
    for (const style of styles) {
      for (const [, key] of style.matchAll(/([A-Za-z]+)\s*:/g)) {
        assert.ok(
          allowed.has(key),
          `style animasi memakai properti non-transform: ${key} (${style.replace(/\s+/g, " ").trim()})`,
        );
      }
    }
  });
});

describe("I. a11y rail & dekorasi", () => {
  test("rail non-aktif tidak bisa difokus/dibaca screen reader", () => {
    assert.match(CODE, /aria-hidden=\{!railActive\}/);
    assert.match(CODE, /inert=\{!railActive\}/);
    assert.match(
      CODE,
      /aria-hidden=\{railActive \|\| undefined\}/,
      "judul disembunyikan saat rail aktif agar tidak dobel dengan kartu",
    );
  });

  test("fokus dipindah ke judul sebelum rail dinonaktifkan (inert)", () => {
    const disable = CODE.indexOf("if (!active) moveFocusOutOfRail();");
    const setOff = CODE.indexOf("setRailActive(active);");
    assert.ok(disable > -1, "pemindah fokus dipanggil saat rail mau non-aktif");
    assert.ok(setOff > disable, "fokus dipindah sebelum inert dipasang");
    assert.match(CODE, /titleRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
    assert.match(CODE, /tabIndex=\{-1\}/, "judul bisa menerima fokus programatik");
  });

  test("layer dekoratif aria-hidden dan tidak menadah klik", () => {
    const bg = CODE.match(/className="ts-bg[^"]*"/)?.[0] ?? "";
    assert.match(bg, /pointer-events-none/);
    assert.match(
      CODE,
      /<div aria-hidden className="ts-bg pointer-events-none absolute inset-0"/,
    );
    const section = CODE.match(/<section className="[^"]*"/)?.[0] ?? "";
    assert.doesNotMatch(section, /aria-hidden/, "section asli tidak boleh aria-hidden");
  });

  test("pseudo kartu tetap melengkung mengikuti radius", () => {
    const before = cssBlock(".ts-card::before");
    assert.ok(before, "pseudo .ts-card::before tidak ditemukan");
    assert.match(before, /border-radius:\s*inherit/);
    assert.doesNotMatch(CODE, /\.ts-card::after/, "cincin accent hanya satu pseudo");
  });

  test("latar tidak memakai warna accent dan konstelasi netral", () => {
    const bg = cssBlock(".ts-bg");
    assert.ok(bg, "blok .ts-bg tidak ditemukan");
    assert.doesNotMatch(bg, /235\s*,\s*89\s*,\s*57/i);
    assert.doesNotMatch(SC_CODE, /text-accent/);
  });
});
