"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useAdminCounts } from "@/components/admin/admin-counts";
import {
  ProjectIcon,
  BadgeIcon,
  ImageIcon,
  ChatIcon,
  InboxIcon,
  LayoutIcon,
  ChartIcon,
  BriefcaseIcon,
  QuoteIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/admin/icons";

// ============================================================================
// AdminRail — navigasi panel admin.
//
// Sembilan seksi dikelompokkan menurut alur kerja (masuk → konten → pustaka),
// bukan dijejer sebagai satu deret tab. Kelompok membuat rail tetap terbaca
// walau isinya bertambah, dan setiap tautan menyebut satu pekerjaan konkret.
//
// Rail adalah <nav> asli berisi tautan yang mengubah hash URL, sehingga:
//   - tombol Back browser bekerja seperti yang diharapkan,
//   - seksi bisa ditautkan langsung (/admin#projects),
//   - dibuka ulang di tab yang sama tetap di seksi terakhir.
// ============================================================================

export type TabKey =
  | "messages"
  | "analytics"
  | "site"
  | "experience"
  | "testimonials"
  | "projects"
  | "certifications"
  | "gallery"
  | "comments";

type Item = {
  key: TabKey;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

type Group = {
  label: string;
  items: Item[];
};

/** Dikelompokkan menurut alur kerja, bukan menurut tabel database. */
export const RAIL_GROUPS: Group[] = [
  {
    label: "Masuk",
    items: [
      { key: "messages", label: "Pesan", Icon: InboxIcon },
      { key: "comments", label: "Komentar", Icon: ChatIcon },
    ],
  },
  {
    label: "Konten",
    items: [
      { key: "site", label: "Konten situs", Icon: LayoutIcon },
      { key: "experience", label: "Pengalaman", Icon: BriefcaseIcon },
      { key: "testimonials", label: "Testimoni", Icon: QuoteIcon },
      { key: "projects", label: "Proyek", Icon: ProjectIcon },
    ],
  },
  {
    label: "Pustaka",
    items: [
      { key: "certifications", label: "Sertifikasi", Icon: BadgeIcon },
      { key: "gallery", label: "Galeri", Icon: ImageIcon },
      { key: "analytics", label: "Statistik", Icon: ChartIcon },
    ],
  },
];

export const ALL_TABS: TabKey[] = RAIL_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key),
);

export function isTabKey(value: string): value is TabKey {
  return (ALL_TABS as string[]).includes(value);
}

export function tabLabel(key: TabKey): string {
  for (const group of RAIL_GROUPS) {
    const found = group.items.find((i) => i.key === key);
    if (found) return found.label;
  }
  return key;
}

// ── Satu tautan rail ────────────────────────────────────────────────────────

function RailLink({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: Item;
  active: boolean;
  badge?: number;
  onNavigate: (key: TabKey) => void;
}) {
  const { key, label, Icon } = item;
  return (
    <a
      href={`#${key}`}
      onClick={(e) => {
        // Biarkan modifier-click berperilaku normal (buka di tab baru).
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onNavigate(key);
      }}
      aria-current={active ? "page" : undefined}
      className="a-rail-link"
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        // Angka notifikasi: satu-satunya isian aksen di rail selain penanda
        // seksi aktif, jadi mata langsung menemukannya.
        <span
          className="a-data shrink-0 rounded-full px-1.5 py-0.5 a-micro font-semibold leading-none"
          style={{
            backgroundColor: "var(--color-a-accent)",
            color: "var(--color-a-on-accent)",
          }}
          aria-label={`${badge} menunggu`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </a>
  );
}

// ── Isi rail ────────────────────────────────────────────────────────────────

function RailBody({
  tab,
  onNavigate,
}: {
  tab: TabKey;
  onNavigate: (key: TabKey) => void;
}) {
  const { messages, comments } = useAdminCounts();

  const badgeFor = (key: TabKey): number | undefined => {
    if (key === "messages") return messages;
    if (key === "comments") return comments;
    return undefined;
  };

  return (
    <nav aria-label="Seksi panel admin" className="flex flex-col gap-6">
      {RAIL_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="a-key mb-2 px-2">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <RailLink
                key={item.key}
                item={item}
                active={tab === item.key}
                badge={badgeFor(item.key)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ── Rail ────────────────────────────────────────────────────────────────────

export default function AdminRail({
  tab,
  onNavigate,
}: {
  tab: TabKey;
  onNavigate: (key: TabKey) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Drawer mobile: Escape menutup, fokus pindah ke tombol tutup saat dibuka,
  // dan latar belakang tidak ikut ter-scroll.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  function navigate(key: TabKey) {
    onNavigate(key);
    setDrawerOpen(false);
  }

  return (
    <>
      {/* ── Rail tetap (≥ lg) ── */}
      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <RailBody tab={tab} onNavigate={navigate} />
        </div>
      </aside>

      {/* ── Pemicu drawer (< lg) ── */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          className="a-btn a-btn-ghost w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <MenuIcon className="h-4 w-4" />
            <span className="normal-case tracking-normal">Seksi</span>
          </span>
          {/* Seksi aktif ditulis penuh (tanpa peredupan) — ini satu-satunya
              penanda posisi saat rail tersembunyi di layar kecil. */}
          <span className="a-data a-meta normal-case tracking-normal">
            {tabLabel(tab)}
          </span>
        </button>
      </div>

      {/* ── Drawer mobile ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div
            role="presentation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/65"
            style={{ animation: "admin-fade-up 0.2s ease-out forwards" }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pilih seksi"
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-[var(--color-a-line)] bg-[var(--color-a-canvas)] p-4"
            style={{ animation: "admin-rail-in 0.28s cubic-bezier(0.16,1,0.3,1) forwards" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="a-key">Panel admin</span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
                className="a-icon-btn"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RailBody tab={tab} onNavigate={navigate} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
