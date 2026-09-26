"use client";

import type { ReactNode } from "react";
import {
  GripIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@/components/admin/icons";

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
      className={`group/row flex flex-wrap items-center gap-3 border-b px-2 py-3 transition-colors duration-200 lg:gap-4 lg:py-3.5 ${
        dragging
          ? "border-[var(--color-a-accent)]/50 bg-[var(--color-a-accent)]/[0.06] opacity-60"
          : dropTarget
            ? "border-[var(--color-a-accent)] bg-[var(--color-a-accent)]/[0.07]"
            : "border-[var(--color-a-line)] hover:bg-[var(--color-a-surface)]"
      }`}
    >
      <div className="flex w-[4.5rem] shrink-0 items-center gap-1">
        <span
          aria-hidden="true"
          title="Geser untuk mengubah urutan"
          className="flex h-9 w-5 cursor-grab items-center justify-center text-[var(--color-a-faint)] transition-colors group-hover/row:text-[var(--color-a-dim)] active:cursor-grabbing"
        >
          <GripIcon className="h-4 w-4" />
        </span>

        <div className="flex flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0 || saving}
            aria-label={`Naikkan ke posisi ${index} dari ${total}`}
            title="Naik"
            className="flex h-[17px] w-6 items-center justify-center rounded text-[var(--color-a-faint)] transition-colors hover:text-[var(--color-a-accent)] disabled:cursor-not-allowed disabled:opacity-25"
          >
            <ChevronUpIcon className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1 || saving}
            aria-label={`Turunkan ke posisi ${index + 2} dari ${total}`}
            title="Turun"
            className="flex h-[17px] w-6 items-center justify-center rounded text-[var(--color-a-faint)] transition-colors hover:text-[var(--color-a-accent)] disabled:cursor-not-allowed disabled:opacity-25"
          >
            <ChevronDownIcon className="h-3 w-3" />
          </button>
        </div>

        <span
          aria-hidden="true"
          className="a-data w-4 shrink-0 text-right a-meta text-[var(--color-a-faint)]"
        >
          {index + 1}
        </span>
      </div>

      {children}
    </div>
  );
}
