"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import ProjectsManager from "@/components/admin/ProjectsManager";
import CertificationsManager from "@/components/admin/CertificationsManager";
import GalleryManager from "@/components/admin/GalleryManager";
import CommentsManager from "@/components/admin/CommentsManager";
import {
  ProjectIcon,
  BadgeIcon,
  ImageIcon,
  ChatIcon,
  ExternalIcon,
  SignOutIcon,
  LockIcon,
} from "@/components/admin/icons";

const TABS: { key: TabKey; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { key: "projects", label: "Projects", Icon: ProjectIcon },
  { key: "certifications", label: "Certs", Icon: BadgeIcon },
  { key: "gallery", label: "Gallery", Icon: ImageIcon },
  { key: "comments", label: "Comments", Icon: ChatIcon },
];

type TabKey = "projects" | "certifications" | "gallery" | "comments";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("projects");

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (!configured) {
    return (
      <div className="min-h-[100dvh] bg-ink px-6 text-ecru">
        <div className="mx-auto flex min-h-[100dvh] max-w-6xl items-center justify-center">
          <div className="admin-fade-up w-full max-w-md border-y border-white/10 py-8 text-center sm:border sm:px-8">
            <LockIcon className="mx-auto mb-4 text-accent" />
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent">
              Admin access
            </p>
            <h1 className="text-display mb-3 text-2xl uppercase text-white">
              Not configured<span className="text-accent">.</span>
            </h1>
            <p className="mb-6 text-sm leading-6 text-gray-400">
              Supabase environment variables are missing. Add them to{" "}
              <code className="text-accent">.env.local</code>, rebuild, then try
              again.
            </p>
            <a
              href="/"
              className="text-sm text-gray-500 transition-colors hover:text-accent"
            >
              ← Back to site
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-ink text-ecru">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
          <a
            href="/"
            className="text-display text-sm uppercase tracking-[0.14em] text-white transition-colors hover:text-accent"
          >
            Aura <span className="text-accent">Auvarose</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="mr-2 hidden text-[10px] uppercase tracking-[0.24em] text-gray-400 sm:inline">
              Admin workspace
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              aria-label="View site in new tab"
              title="View site"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-gray-400 transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.97]"
            >
              <ExternalIcon />
            </a>
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-gray-400 transition-colors duration-300 hover:border-red-500/60 hover:text-red-400 active:scale-[0.97]"
            >
              <SignOutIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="admin-fade-up mb-10 max-w-2xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-accent">
            Content library
          </p>
          <h1 className="text-display text-4xl uppercase text-white md:text-5xl">
            Manage the work<span className="text-accent">.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-gray-500">
            Keep your projects, credentials, and selected images up to date.
          </p>
        </div>

        {/* Tab-nav: pill segmented — ikon + label, latar pill tipis,
            item aktif terang + aksen. Semua flat (paint-only). */}
        <nav
          aria-label="Content sections"
          className="mb-10 flex w-fit flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
        >
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors duration-300 active:scale-[0.98] ${
                tab === key
                  ? "bg-accent text-black"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={tab === key ? "" : "opacity-70"} />
              {label}
            </button>
          ))}
        </nav>

        <div key={tab} className="admin-fade-up">
          {tab === "projects" && <ProjectsManager />}
          {tab === "certifications" && <CertificationsManager />}
          {tab === "gallery" && <GalleryManager />}
          {tab === "comments" && <CommentsManager />}
        </div>
      </main>
    </div>
  );
}
