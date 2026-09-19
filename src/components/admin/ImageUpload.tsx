"use client";

import { useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "@/lib/config";
import {
  PlusIcon,
  TrashIcon,
  ImageIcon,
  SpinnerIcon,
} from "@/components/admin/icons";

const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

type ImageUploadProps = {
  folder: string;
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
};

function isPdfUrl(url: string): boolean {
  const q = url.split("?")[0].toLowerCase();
  return (
    q.endsWith(".pdf") || url.toLowerCase().startsWith("data:application/pdf")
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUpload({
  folder,
  value,
  onChange,
  label = "Berkas",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [size, setSize] = useState<number | null>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `Berkas terlalu besar (${formatSize(file.size)}). Maksimal ${MAX_MB} MB.`,
      );
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder,
          size: file.size,
        }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Gagal menyiapkan unggahan");
      }
      const { url, publicUrl } = await presignRes.json();

      let putRes: Response;
      try {
        putRes = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      } catch {
        // `fetch` melempar (bukan respons non-OK) → hampir selalu CORS.
        throw new Error(
          "Unggahan terputus oleh browser (CORS). Pastikan bucket R2 sudah punya konfigurasi CORS yang mengizinkan PUT dari domain ini — lihat README.",
        );
      }
      if (!putRes.ok) throw new Error(`Unggahan ke R2 gagal (${putRes.status})`);

      setSize(file.size);
      onChange(publicUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unggahan gagal";
      setError(
        msg.includes("Failed to fetch")
          ? "Koneksi ke penyimpanan gagal (CORS). Periksa konfigurasi CORS bucket R2."
          : msg,
      );
    } finally {
      setUploading(false);
    }
  }

  const isPdf = value ? isPdfUrl(value) : false;

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-[var(--color-a-dim)]">
        {label}
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`flex flex-col gap-4 rounded-lg border border-dashed p-3 transition-colors sm:flex-row sm:items-start ${
          dragOver
            ? "border-[var(--color-a-accent)] bg-[var(--color-a-accent)]/[0.06]"
            : "border-[var(--color-a-line-2)]"
        }`}
      >
        {/* Pratinjau rasio tetap supaya form tidak melompat saat gambar
            selesai dimuat. */}
        <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-a-line)] bg-[var(--color-a-surface-2)] sm:w-36">
          {value ? (
            isPdf ? (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[var(--color-a-accent)] transition-colors hover:bg-[var(--color-a-surface)]"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M12 18v-6" />
                  <path d="M9 15h6" />
                </svg>
                <span className="a-key a-micro">PDF</span>
              </a>
            ) : (
              <img
                src={value}
                alt="Pratinjau berkas terunggah"
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <span
              aria-hidden="true"
              className="flex flex-col items-center gap-1.5 text-[var(--color-a-faint)]"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="a-key a-micro">Kosong</span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="a-btn a-btn-ghost"
            >
              {uploading ? (
                <SpinnerIcon className="h-3.5 w-3.5" />
              ) : (
                <PlusIcon className="h-3.5 w-3.5" />
              )}
              {uploading
                ? "Mengunggah…"
                : value
                  ? "Ganti berkas"
                  : "Unggah berkas"}
            </button>

            {value && !uploading && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setSize(null);
                  setError(null);
                }}
                className="a-btn a-btn-ghost a-btn-danger"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Hapus
              </button>
            )}
          </div>

          <p className="mt-2 a-meta leading-relaxed text-[var(--color-a-faint)]">
            Tarik berkas ke sini, atau pilih manual. JPG, PNG, WebP, atau PDF —
            maksimal {MAX_MB} MB
            {size !== null && ` · terunggah ${formatSize(size)}`}.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-2 text-xs leading-relaxed text-[var(--color-a-danger)]"
            >
              {error}
            </p>
          )}

          {value && (
            <details className="mt-2.5">
              <summary className="cursor-pointer a-meta text-[var(--color-a-faint)] transition-colors hover:text-[var(--color-a-dim)]">
                URL berkas
              </summary>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label="URL berkas"
                className="a-data mt-1.5 w-full rounded-md border border-[var(--color-a-line-2)] bg-[var(--color-a-surface)] px-2.5 py-1.5 a-meta text-[var(--color-a-dim)] outline-none transition-colors focus:border-[var(--color-a-accent)]"
              />
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
