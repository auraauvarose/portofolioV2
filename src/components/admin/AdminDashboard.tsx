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
      <div className="tv-static relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
        <div className="relative max-w-md rounded-2xl border border-white/10 bg-panel p-8 text-center">
          <h1 className="text-display mb-3 text-2xl uppercase text-white">
            Not configured
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-400">
            Supabase environment variables are missing. Add them to{" "}
            <code className="text-accent">.env.local</code> (see README), rebuild,
            then try again.
          </p>
          <a
            href="/"
            className="text-sm uppercase tracking-widest text-accent hover:underline"
          >
            ← Back to site
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-static relative min-h-screen overflow-x-hidden bg-ink px-6 py-8 md:px-10">
      <div className="relative mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl uppercase text-white">
            Admin<span className="text-accent">.</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your portfolio content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-accent hover:text-accent"
          >
            View site
          </a>
          <button
            onClick={signOut}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-red-500 hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="mb-8 flex gap-2 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium uppercase tracking-widest transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div>
        {tab === "projects" && <ProjectsManager />}
        {tab === "certifications" && <CertificationsManager />}
        {tab === "gallery" && <GalleryManager />}
      </div>
      </div>
    </div>
  );
}
