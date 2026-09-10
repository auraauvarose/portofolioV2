"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

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
      setShake((value) => value + 1);
      return;
    }

    const next = searchParams.get("next") ?? "/admin";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] bg-ink text-ecru">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <a
          href="/"
          className="text-display text-sm uppercase tracking-[0.14em] text-white transition-colors hover:text-accent"
        >
          Aura <span className="text-accent">Auvarose</span>
        </a>
        <span className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
          Admin access
        </span>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-85px)] max-w-6xl items-start gap-14 px-6 pb-16 pt-20 md:px-10 md:pt-24 lg:items-center lg:pt-0 lg:grid-cols-[1fr_360px] lg:gap-24">
        <section className="admin-fade-up hidden lg:block">
          <p className="mb-6 text-[10px] uppercase tracking-[0.28em] text-accent">
            Private workspace
          </p>
          <h1 className="text-display max-w-xl text-6xl uppercase leading-[0.9] text-white xl:text-7xl">
            Keep the work moving<span className="text-accent">.</span>
          </h1>
          <p className="mt-8 max-w-sm text-sm leading-7 text-gray-500">
            Update projects, certifications, and selected work from one quiet place.
          </p>
        </section>

        <section
          key={shake}
          className={`admin-fade-up w-full ${error ? "admin-shake" : ""}`}
        >
          <div className="border-y border-white/10 py-8 sm:border sm:px-8">
            <div className="mb-8">
              <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent">
                Welcome back
              </p>
              <h1 className="text-display text-3xl uppercase text-white">
                Sign in<span className="text-accent">.</span>
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Enter your password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-gray-400"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mb-5 w-full rounded-md border border-white/15 bg-transparent px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 hover:border-white/30 focus:border-accent"
              />

              {error && (
                <p
                  role="alert"
                  className="mb-5 border-l-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-300"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-accent-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Checking…" : "Continue"}
              </button>
            </form>

            <a
              href="/"
              className="mt-7 inline-block text-xs text-gray-500 transition-colors hover:text-accent"
            >
              ← Back to site
            </a>
          </div>
        </section>
      </main>
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
