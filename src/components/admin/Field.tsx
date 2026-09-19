"use client";

import { useId, type ReactNode } from "react";

// ============================================================================
// Field — satu baris isian untuk seluruh form admin.
//
// Label selalu terhubung ke input lewat id (htmlFor + aria-describedby), jadi
// pembaca layar mengumumkan label dan catatan bantuan bersama nilainya.
// `hint` menampung catatan bantuan supaya tidak ditulis sebagai <p> lepas di
// setiap manager — sebelumnya itu membuat spasi antar form tidak seragam.
// ============================================================================

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
  /** id <datalist> untuk memberi saran nilai (tetap bisa ketik bebas). */
  list?: string;
  /** Catatan bantuan di bawah isian. */
  hint?: ReactNode;
  /** Tinggi textarea dalam baris (default 3). */
  rows?: number;
  type?: "text" | "url" | "email" | "number";
  /** Ubah ke kontrol kustom (mis. <select>) memakai id & kelas yang sama. */
  render?: (props: {
    id: string;
    describedBy: string | undefined;
    className: string;
  }) => ReactNode;
};

export default function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  required,
  list,
  hint,
  rows = 3,
  type = "text",
  render,
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  const base =
    "w-full rounded-lg border border-[var(--color-a-line-2)] bg-[var(--color-a-surface)] px-3 py-2.5 text-sm text-[var(--color-a-text)] outline-none transition-colors placeholder:text-[var(--color-a-faint)] hover:border-[var(--color-a-accent)]/50 focus:border-[var(--color-a-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-a-accent)]";

  return (
    <div className="block">
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-1.5 text-xs font-medium text-[var(--color-a-dim)]"
      >
        <span>{label}</span>
        {required && (
          <span
            className="text-[var(--color-a-accent)]"
            title="Wajib diisi"
            aria-label="wajib diisi"
          >
            *
          </span>
        )}
      </label>

      {render ? (
        render({ id, describedBy: hintId, className: base })
      ) : textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-describedby={hintId}
          className={`${base} resize-y leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          list={list}
          aria-describedby={hintId}
          className={base}
        />
      )}

      {hint && (
        <p
          id={hintId}
          className="mt-1.5 a-meta leading-relaxed text-[var(--color-a-faint)]"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
