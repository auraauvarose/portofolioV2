"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login gagal. Coba lagi.");
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/admin";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="tv-static relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-[25rem] w-[25rem] rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/5 blur-[100px]" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-panel/90 p-8 shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-display mb-1 text-3xl uppercase text-white">
          Admin<span className="text-accent">.</span>
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Masukkan password untuk mengelola konten.
        </p>

        <label className="mb-1 block text-xs uppercase tracking-widest text-gray-400">
          Password
        </label>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-accent"
          placeholder="••••••••"
        />

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-3 font-semibold uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Masuk…" : "Masuk"}
        </button>

        <a
          href="/"
          className="mt-6 block text-center text-sm text-gray-500 hover:text-accent"
        >
          ← Back to site
        </a>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
