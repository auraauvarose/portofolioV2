"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProjectsManager from "@/components/admin/ProjectsManager";
import CertificationsManager from "@/components/admin/CertificationsManager";
import GalleryManager from "@/components/admin/GalleryManager";

const TABS = [
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "gallery", label: "Gallery" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-10">
          <a
            href="/"
            className="text-display text-sm uppercase tracking-[0.14em] text-white transition-colors hover:text-accent"
          >
            Aura <span className="text-accent">Auvarose</span>
          </a>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="text-[10px] uppercase tracking-[0.24em] text-gray-400">
              Admin workspace
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 transition-colors hover:text-accent"
            >
              View site ↗
            </a>
            <button
              onClick={signOut}
              className="text-gray-400 transition-colors hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="admin-fade-up mb-12 max-w-2xl">
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

        <nav
          aria-label="Content sections"
          className="mb-10 flex flex-wrap gap-x-7 gap-y-3 border-b border-white/10"
        >
          {TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              aria-current={tab === item.key ? "page" : undefined}
              className={`relative -mb-px border-b pb-3 text-xs uppercase tracking-[0.18em] transition-colors duration-300 active:scale-[0.98] ${
                tab === item.key
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div key={tab} className="admin-fade-up">
          {tab === "projects" && <ProjectsManager />}
          {tab === "certifications" && <CertificationsManager />}
          {tab === "gallery" && <GalleryManager />}
        </div>
      </main>
    </div>
  );
}
