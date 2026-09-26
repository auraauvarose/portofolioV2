export type FallbackResult<T> = {
  ok: boolean;
  attempts: number;
  data?: T;
  error?: string;
};

export async function withFallback<A, T>(
  attempts: A[],
  run: (attempt: A) => Promise<{ error: unknown; data?: T | null }>,
): Promise<FallbackResult<T>> {
  let last = "tidak ada percobaan yang dijalankan";
  for (let i = 0; i < attempts.length; i++) {
    const { error, data } = await run(attempts[i]);
    if (!error) {
      return {
        ok: true,
        attempts: i + 1,
        data: data ?? undefined,
      };
    }
    last = errorMessage(error);
  }
  return { ok: false, attempts: attempts.length, error: last };
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  if (typeof error === "string" && error) return error;
  return "query gagal tanpa pesan";
}
