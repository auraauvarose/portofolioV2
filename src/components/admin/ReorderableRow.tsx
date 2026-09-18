"use client";

import type { ReactNode } from "react";
import { GripIcon, ChevronUpIcon, ChevronDownIcon } from "@/components/admin/icons";

// ============================================================================
// ReorderableRow — baris daftar admin yang bisa digeser.
//
// Drag-and-drop (mouse) + tombol naik/turun (keyboard & sentuh). Tombolnya
// bukan sekadar pelengkap: drag HTML5 tidak bisa dioperasikan dengan keyboard,
// jadi tanpa tombol ini urutan tidak dapat diubah oleh pengguna keyboard.
// ============================================================================

type Props = {
  index: number;
  total: number;
  dragging: boolean;
  dropTarget: boolean;
  saving: boolean;
  dragProps: Record<string, unknown>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
};

export default function ReorderableRow({
  index,
  total,
  dragging,
  dropTarget,
  saving,
  dragProps,
  onMoveUp,
  onMoveDown,
  children,
}: Props) {
  return (
    <div
      {...dragProps}
      className={`flex flex-wrap items-center gap-3 border-b py-4 transition-colors duration-300 ${
        dragging
          ? "border-accent/60 opacity-50"
          : dropTarget
            ? "border-accent bg-accent/[0.04]"
            : "border-white/10 hover:border-accent/40"
      }`}
    >
      {/* Handle: indikator visual bahwa baris bisa digeser */}
      <span
        aria-hidden="true"
        title="Geser untuk mengubah urutan"
        className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center text-gray-600 transition-colors hover:text-accent active:cursor-grabbing"
      >
        <GripIcon />
      </span>

      {/* Kontrol keyboard / sentuh */}
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0 || saving}
          aria-label={`Pindahkan ke atas (posisi ${index + 1} dari ${total})`}
          title="Naik"
          className="flex h-[18px] w-6 items-center justify-center rounded-sm text-gray-500 transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ChevronUpIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1 || saving}
          aria-label={`Pindahkan ke bawah (posisi ${index + 1} dari ${total})`}
          title="Turun"
          className="flex h-[18px] w-6 items-center justify-center rounded-sm text-gray-500 transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {children}
    </div>
  );
}
