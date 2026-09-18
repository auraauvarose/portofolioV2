"use client";

import { createContext, useContext } from "react";
import type { SiteContent } from "@/lib/site-content";

// ============================================================================
// SiteContentProvider — menyebarkan konten situs (dari DB, fallback config)
// ke seluruh komponen klien tanpa prop drilling.
//
// Nilainya di-inject sekali di server (layout.tsx) sehingga tidak ada
// waterfall fetch di klien, dan HTML pertama sudah berisi konten yang benar.
// ============================================================================

const SiteContentContext = createContext<SiteContent | null>(null);

export function SiteContentProvider({
  value,
  children,
}: {
  value: SiteContent;
  children: React.ReactNode;
}) {
  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

/**
 * Konten situs. Wajib berada di dalam SiteContentProvider.
 *
 * Sengaja melempar (bukan fallback diam-diam) supaya provider yang lupa
 * dipasang langsung ketahuan saat development, bukan menghasilkan halaman
 * kosong yang membingungkan.
 */
export function useSiteContent(): SiteContent {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error(
      "useSiteContent harus dipakai di dalam <SiteContentProvider> (lihat src/app/layout.tsx)",
    );
  }
  return ctx;
}
