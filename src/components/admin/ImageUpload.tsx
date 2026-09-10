"use client";

import { useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "@/lib/config";
import { PlusIcon, TrashIcon, ImageIcon } from "@/components/admin/icons";

const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

type ImageUploadProps = {
  folder: string;
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
};

function isPdfUrl(url: string): boolean {
  const q = url.split("?")[0].toLowerCase();
  return q.endsWith(".pdf") || url.toLowerCase().startsWith("data:application/pdf");
}

export default function ImageUpload({
  folder,
  value,
  onChange,
  label = "File",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File too large. Maximum allowed is ${MAX_MB} MB.`);
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
        throw new Error(err.error ?? "Failed to prepare upload");
      }
      const { url, publicUrl } = await presignRes.json();

      let putRes: Response;
      try {
        putRes = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      } catch (fetchErr) {
        throw new Error(
          "Upload terputus oleh browser (CORS). Pastikan bucket R2 sudah punya konfigurasi CORS yang mengizinkan PUT dari domain ini (lihat README).",
        );
      }
      if (!putRes.ok) throw new Error(`Upload to R2 failed (${putRes.status})`);

      onChange(publicUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg.includes("Failed to fetch") ? "Koneksi ke penyimpanan gagal (CORS). Periksa konfigurasi CORS bucket R2." : msg);
    } finally {
      setUploading(false);
    }
  }

  const isPdf = value ? isPdfUrl(value) : false;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <div className="flex items-start gap-4">
        <div className="flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/20">
          {value ? (
            isPdf ? (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-accent hover:bg-white/5"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M12 18v-6" />
                  <path d="M9 15h6" />
                </svg>
                <span className="px-2 text-center text-[10px] uppercase tracking-widest text-gray-300">
                  PDF
                </span>
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span
              className="flex flex-col items-center justify-center gap-1.5 text-gray-600"
              title="No file"
            >
              <ImageIcon />
              <span className="text-[10px] uppercase tracking-widest">Empty</span>
            </span>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-white transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <PlusIcon />
              {uploading ? "Uploading…" : value ? "Replace file" : "Upload file"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Remove file"
                title="Remove file"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-500 transition-colors hover:border-red-500 hover:text-red-400"
              >
                <TrashIcon />
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
            Supports images (JPG, PNG, WebP) and PDF. Max {MAX_MB} MB.
          </p>
          {value && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-2 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-xs text-gray-400 outline-none transition-colors focus:border-accent"
              placeholder="File URL"
            />
          )}
        </div>
      </div>
    </div>
  );
}
