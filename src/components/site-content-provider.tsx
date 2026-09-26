"use client";

import { createContext, useContext } from "react";
import type { SiteContent } from "@/lib/site-content";

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

export function useSiteContent(): SiteContent {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error(
      "useSiteContent harus dipakai di dalam <SiteContentProvider> (lihat src/app/layout.tsx)",
    );
  }
  return ctx;
}
