"use client";

import { useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "@/lib/config";

const MAX_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

type ImageUploadProps = {
  folder: string;
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
};

export default function ImageUpload({
  folder,
  value,
  onChange,
  label = "Image",
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
      // 1. Get a presigned upload URL from our API
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

      // 2. Upload the file directly to R2
      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to R2 failed");

      // 3. Hand the public URL back to the form
      onChange(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <div className="flex items-start gap-4">
        <div className="flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-gray-600">No image</span>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ml-2 rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-red-400"
            >
              Remove
            </button>
          )}
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          {value && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-400"
              placeholder="Image URL"
            />
          )}
        </div>
      </div>
    </div>
  );
}
