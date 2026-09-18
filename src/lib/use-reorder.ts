"use client";

import { useCallback, useRef, useState } from "react";

// ============================================================================
// useReorder — drag-and-drop urutan untuk daftar di /admin.
//
// Sengaja memakai HTML5 drag events bawaan, tanpa library: daftar di admin
// hanya puluhan baris, dan menambah dependensi (dnd-kit ~40 kB) tidak
// sepadan. Untuk aksesibilitas keyboard tersedia tombol naik/turun di UI.
// ============================================================================

export type ReorderTable =
  | "projects"
  | "certifications"
  | "gallery_photos"
  | "experience"
  | "testimonials";

export function useReorder<T extends { id: string }>(
  table: ReorderTable,
  items: T[],
  setItems: (next: T[]) => void,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  const persist = useCallback(
    async (ordered: T[]) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, ids: ordered.map((x) => x.id) }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.error ?? "Gagal menyimpan urutan");
        }
      } catch {
        setError("Gagal menyimpan urutan");
      }
      setSaving(false);
    },
    [table],
  );

  /** Pindahkan item dari `from` ke `to`, lalu simpan. */
  const move = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0) return;
      if (from >= items.length || to >= items.length) return;

      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      setItems(next); // optimistis — UI langsung berubah
      void persist(next);
    },
    [items, setItems, persist],
  );

  const moveBy = useCallback(
    (id: string, delta: number) => {
      const from = items.findIndex((x) => x.id === id);
      if (from === -1) return;
      move(from, from + delta);
    },
    [items, move],
  );

  // --- Handler drag untuk satu baris ---
  const dragHandlers = useCallback(
    (index: number) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        dragIndex.current = index;
        setDragId(items[index]?.id ?? null);
        // Firefox butuh setData agar drag benar-benar dimulai.
        e.dataTransfer.setData("text/plain", items[index]?.id ?? "");
        e.dataTransfer.effectAllowed = "move";
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOverId(items[index]?.id ?? null);
      },
      onDragLeave: () => {
        setOverId((cur) => (cur === items[index]?.id ? null : cur));
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const from = dragIndex.current;
        if (from !== null) move(from, index);
        dragIndex.current = null;
        setDragId(null);
        setOverId(null);
      },
      onDragEnd: () => {
        dragIndex.current = null;
        setDragId(null);
        setOverId(null);
      },
    }),
    [items, move],
  );

  return {
    dragHandlers,
    dragId,
    overId,
    saving,
    error,
    clearError: () => setError(null),
    moveBy,
  };
}
