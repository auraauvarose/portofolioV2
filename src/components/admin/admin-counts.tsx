"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ============================================================================
// AdminCounts — angka notifikasi untuk rail navigasi.
//
// Rail perlu tahu ada berapa pesan baru & komentar menunggu tanpa harus
// membuka kedua panel itu.
//
// Sumber angkanya dua lapis supaya tidak ada permintaan ganda:
//   1. Satu kali pengambilan di latar saat panel admin dibuka, supaya badge
//      sudah benar walau seksi tersebut belum pernah dibuka.
//   2. Panel yang sedang terbuka melaporkan angkanya sendiri lewat report() —
//      datanya sudah ada di tangan, jadi tidak perlu diambil ulang.
//
// Pengambilan latar sengaja gagal diam-diam: badge adalah pelengkap, bukan
// penghalang. Kalau jaringan bermasalah, rail tetap tampil tanpa angka.
// ============================================================================

type CountKey = "messages" | "comments";
type Counts = Record<CountKey, number>;

type AdminCountsValue = Counts & {
  /** Laporkan angka dari panel yang sudah memegang datanya. */
  report: (key: CountKey, value: number) => void;
  /** Ambil ulang dari server (dipakai setelah perubahan status). */
  refresh: () => void;
};

const AdminCountsContext = createContext<AdminCountsValue>({
  messages: 0,
  comments: 0,
  report: () => {},
  refresh: () => {},
});

export function useAdminCounts() {
  return useContext(AdminCountsContext);
}

/**
 * Laporkan angka ke rail setiap kali nilainya berubah. Dipakai panel yang
 * memegang data lengkapnya sendiri, sehingga rail tidak perlu fetch ulang.
 */
export function useReportCount(key: CountKey, value: number) {
  const { report } = useAdminCounts();
  useEffect(() => {
    report(key, value);
  }, [report, key, value]);
}

export function AdminCountsProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Counts>({ messages: 0, comments: 0 });
  // Seksi yang sudah melaporkan angkanya sendiri tidak boleh ditimpa oleh
  // hasil pengambilan latar yang mungkin lebih tua.
  const reported = useRef<Record<CountKey, boolean>>({
    messages: false,
    comments: false,
  });
  const [nonce, setNonce] = useState(0);

  const report = useCallback((key: CountKey, value: number) => {
    reported.current[key] = true;
    setCounts((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const refresh = useCallback(() => {
    // Setelah perubahan status, panel yang terbuka akan melaporkan angka
    // barunya sendiri. Buka kembali izin pengambilan latar untuk seksi yang
    // belum pernah dibuka.
    reported.current = { messages: false, comments: false };
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function pull() {
      const [msgRes, cmtRes] = await Promise.allSettled([
        fetch("/api/contact", { cache: "no-store", signal: controller.signal }),
        fetch("/api/comments?scope=admin", {
          cache: "no-store",
          signal: controller.signal,
        }),
      ]);

      if (!alive) return;

      let messages: number | null = null;
      let comments: number | null = null;

      if (msgRes.status === "fulfilled" && msgRes.value.ok) {
        const data = await msgRes.value.json().catch(() => ({}));
        if (Array.isArray(data?.messages)) {
          messages = data.messages.filter(
            (m: { status?: string }) => m?.status === "new",
          ).length;
        }
      }

      if (cmtRes.status === "fulfilled" && cmtRes.value.ok) {
        const data = await cmtRes.value.json().catch(() => ({}));
        if (Array.isArray(data?.comments)) {
          comments = data.comments.filter(
            (c: { approved?: boolean }) => !c?.approved,
          ).length;
        }
      }

      if (!alive) return;
      setCounts((prev) => ({
        // Angka yang dilaporkan panel lebih baru — jangan ditimpa.
        messages: reported.current.messages ? prev.messages : (messages ?? prev.messages),
        comments: reported.current.comments ? prev.comments : (comments ?? prev.comments),
      }));
    }

    void pull();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [nonce]);

  const value = useMemo(
    () => ({ ...counts, report, refresh }),
    [counts, report, refresh],
  );

  return (
    <AdminCountsContext.Provider value={value}>
      {children}
    </AdminCountsContext.Provider>
  );
}
