"use client";

import Link from "next/link";
import { Suspense, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/admin/icons";

// ============================================================================
// Halaman masuk panel admin.
//
// Satu pekerjaan saja: memasukkan kata sandi. Tata letaknya karena itu satu
// kolom sempit yang tenang — tanpa hero pemasaran yang mengalihkan perhatian.
// ============================================================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordId = useId();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setError(data.error ?? "Masuk gagal. Coba lagi.");
      setLoading(false);
      setShake((value) => value + 1);
      return;
    }

    // Only allow same-origin relative paths — blocks open redirect via ?next=
    const rawNext = searchParams.get("next") ?? "/admin";
    const next =
      rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="admin-scale flex min-h-[100dvh] flex-col bg-[var(--color-a-canvas)] text-[var(--color-a-text)]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 lg:max-w-6xl lg:py-8">
        <Link
          href="/"
          className="text-display text-sm uppercase tracking-[0.14em] transition-colors hover:text-[var(--color-a-accent)] lg:text-base"
        >
          Aura <span className="text-[var(--color-a-accent)]">Auvarose</span>
        </Link>
        <span className="a-key">Panel admin</span>
      </header>

      {/* Kartu diletakkan sedikit di atas titik tengah: secara optis terasa
          lebih seimbang daripada tepat di tengah, karena mata membaca dari
          atas dan ruang sisa di bawah tidak terasa kosong. */}
      <main className="flex flex-1 items-start justify-center px-6 pb-24 pt-6 sm:pt-16">
        <section
          key={shake}
          className={`w-full max-w-sm lg:max-w-md ${error ? "admin-shake" : "admin-fade-up"}`}
        >
          <div className="a-panel p-6 sm:p-7 lg:p-9">
            <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-a-line)] text-[var(--color-a-accent)] lg:mb-6 lg:h-14 lg:w-14">
              <LockIcon className="h-4 w-4 lg:h-5 lg:w-5" />
            </span>

            <h1 className="text-display text-2xl uppercase lg:text-3xl">Masuk</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-a-dim)] lg:mt-3">
              Masukkan kata sandi admin untuk melanjutkan.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 lg:mt-8">
              <label
                htmlFor={passwordId}
                className="mb-1.5 block text-xs font-medium text-[var(--color-a-dim)] lg:mb-2"
              >
                Kata sandi
              </label>

              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-describedby={error ? `${passwordId}-error` : undefined}
                  aria-invalid={error ? true : undefined}
                  className="w-full rounded-lg border border-[var(--color-a-line-2)] bg-[var(--color-a-surface)] px-3 py-2.5 pr-11 text-sm text-[var(--color-a-text)] outline-none transition-colors placeholder:text-[var(--color-a-faint)] hover:border-[var(--color-a-accent)]/50 focus:border-[var(--color-a-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-a-accent)] lg:px-4 lg:py-3.5 lg:pr-14"
                />
                {/* Tombol lihat sandi: mengurangi salah ketik tanpa
                    mengorbankan privasi di layar bersama. */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  title={
                    showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-a-faint)] transition-colors hover:text-[var(--color-a-text)] lg:right-2 lg:h-10 lg:w-10"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                  ) : (
                    <EyeIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                  )}
                </button>
              </div>

              {error && (
                <p
                  id={`${passwordId}-error`}
                  role="alert"
                  className="mt-3 rounded-lg border px-3 py-2 text-sm leading-relaxed"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--color-a-danger) 38%, transparent)",
                    backgroundColor:
                      "color-mix(in srgb, var(--color-a-danger) 8%, transparent)",
                    color: "var(--color-a-danger)",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="a-btn a-btn-primary a-btn-lg mt-5 w-full py-3 lg:mt-6"
              >
                {loading ? "Memeriksa…" : "Masuk"}
              </button>
            </form>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-[var(--color-a-faint)] transition-colors hover:text-[var(--color-a-text)] lg:mt-7"
          >
            ← Kembali ke situs
          </Link>
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
