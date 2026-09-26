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

type CountKey = "messages" | "comments";
type Counts = Record<CountKey, number>;

type AdminCountsValue = Counts & {
  report: (key: CountKey, value: number) => void;
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

export function useReportCount(key: CountKey, value: number) {
  const { report } = useAdminCounts();
  useEffect(() => {
    report(key, value);
  }, [report, key, value]);
}

export function AdminCountsProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Counts>({ messages: 0, comments: 0 });
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
