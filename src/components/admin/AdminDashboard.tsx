"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectsManager from "@/components/admin/ProjectsManager";
import CertificationsManager from "@/components/admin/CertificationsManager";
import GalleryManager from "@/components/admin/GalleryManager";
import CommentsManager from "@/components/admin/CommentsManager";
import MessagesManager from "@/components/admin/MessagesManager";
import SiteContentManager from "@/components/admin/SiteContentManager";
import ExperienceManager from "@/components/admin/ExperienceManager";
import TestimonialsManager from "@/components/admin/TestimonialsManager";
import AnalyticsPanel from "@/components/admin/AnalyticsPanel";
import AdminRail, {
  isTabKey,
  type TabKey,
} from "@/components/admin/AdminRail";
import { AdminCountsProvider } from "@/components/admin/admin-counts";
import { EmptyState } from "@/components/admin/ui";
import {
  ExternalIcon,
  SignOutIcon,
  LockIcon,
} from "@/components/admin/icons";

// ============================================================================
// AdminDashboard — kerangka panel admin.
//
// Tata letak: rail navigasi tetap di kiri, satu panel kerja di kanan. Seksi
// aktif disimpan di hash URL supaya bisa ditautkan langsung, tahan muat ulang,
// dan tombol Back browser bekerja seperti yang diharapkan.
// ============================================================================

/** Tautan cepat ke situs publik — selalu dibuka di tab baru. */
function SiteLink() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noreferrer"
      aria-label="Buka situs di tab baru"
      title="Buka situs"
      className="a-icon-btn"
    >
      <ExternalIcon className="h-4 w-4" />
    </a>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("messages");
  const [signingOut, setSigningOut] = useState(false);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  // Sinkronkan seksi dengan hash URL. Dibaca setelah mount (bukan saat render)
  // karena hash tidak tersedia di server dan akan memicu hydration mismatch.
  useEffect(() => {
    function syncFromHash() {
      const raw = window.location.hash.replace(/^#/, "");
      if (isTabKey(raw)) setTab(raw);
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const navigate = useCallback((key: TabKey) => {
    setTab(key);
    // history.replaceState: mengubah hash tanpa menumpuk riwayat, supaya
    // tombol Back kembali ke halaman sebelumnya — bukan ke seksi sebelumnya.
    window.history.replaceState(null, "", `#${key}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (!configured) {
    return (
      <div className="admin-scale min-h-[100dvh] bg-[var(--color-a-canvas)] px-6 text-[var(--color-a-text)]">
        <div className="mx-auto flex min-h-[100dvh] max-w-lg items-center justify-center">
          <div className="a-panel admin-fade-up w-full p-8 text-center">
            <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-a-line)] text-[var(--color-a-accent)]">
              <LockIcon className="h-5 w-5" />
            </span>
            <p className="a-key mb-2">Konfigurasi</p>
            <h1 className="text-display mb-3 text-2xl uppercase">
              Belum siap dipakai
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--color-a-dim)]">
              Variabel lingkungan Supabase belum ada. Tambahkan{" "}
              <code className="a-data text-[var(--color-a-accent)]">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              dan{" "}
              <code className="a-data text-[var(--color-a-accent)]">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              ke <code className="a-data">.env.local</code>, lalu jalankan ulang
              server.
            </p>
            <Link
              href="/"
              className="a-btn a-btn-ghost"
            >
              Kembali ke situs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminCountsProvider>
      <div className="admin-scale min-h-[100dvh] bg-[var(--color-a-canvas)] text-[var(--color-a-text)]">
        {/* ── Bilah atas ── */}
        <header className="sticky top-0 z-[110] border-b border-[var(--color-a-line)] bg-[var(--color-a-canvas)]/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[84rem] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[5rem] lg:max-w-[96rem] lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="text-display shrink-0 text-sm uppercase tracking-[0.14em] transition-colors hover:text-[var(--color-a-accent)] lg:text-base"
              >
                Aura{" "}
                <span className="text-[var(--color-a-accent)]">Auvarose</span>
              </Link>
              <span
                aria-hidden="true"
                className="hidden h-4 w-px bg-[var(--color-a-line-2)] sm:block"
              />
              <span className="a-key hidden truncate sm:block">
                Panel admin
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <SiteLink />
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                aria-label="Keluar dari panel admin"
                title="Keluar"
                className="a-icon-btn a-icon-btn-danger"
              >
                <SignOutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Isi: rail + panel ── */}
        <div className="mx-auto grid max-w-[84rem] gap-8 px-4 py-6 sm:px-6 lg:max-w-[96rem] lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:py-14">
          <AdminRail tab={tab} onNavigate={navigate} />

          <main className="min-w-0">
            {/* Rail sudah memberi konteks posisi, dan tiap panel punya
                header-nya sendiri. Jadi di sini tidak ada judul tambahan —
                konten langsung mulai tanpa lapisan judul yang berulang. */}
            <div key={tab} className="admin-fade-up">
              {tab === "messages" && <MessagesManager />}
              {tab === "analytics" && <AnalyticsPanel />}
              {tab === "site" && <SiteContentManager />}
              {tab === "experience" && <ExperienceManager />}
              {tab === "testimonials" && <TestimonialsManager />}
              {tab === "projects" && <ProjectsManager />}
              {tab === "certifications" && <CertificationsManager />}
              {tab === "gallery" && <GalleryManager />}
              {tab === "comments" && <CommentsManager />}
              {!isTabKey(tab) && (
                <EmptyState
                  icon={LockIcon}
                  title="Seksi tidak ditemukan"
                  hint="Pilih seksi lain dari menu di samping."
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminCountsProvider>
  );
}
