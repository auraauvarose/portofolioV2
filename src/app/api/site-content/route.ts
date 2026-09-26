import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { defaultSiteContent } from "@/lib/site-content";
import type { SiteContentKey } from "@/types";

export const dynamic = "force-dynamic";

const SITE_KEYS = [
  "nav",
  "profile",
  "hero",
  "about",
  "whatIDo",
  "education",
  "techStack",
] as const satisfies readonly SiteContentKey[];

function isSiteKey(v: unknown): v is SiteContentKey {
  return typeof v === "string" && (SITE_KEYS as readonly string[]).includes(v);
}

function shapeMatches(fallback: unknown, value: unknown): string | null {
  if (fallback === null || fallback === undefined) return null;

  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) return "harus berupa array";
    return null;
  }
  if (typeof fallback === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return "harus berupa objek";
    }
    return null;
  }
  if (typeof fallback !== typeof value) {
    return `harus bertipe ${typeof fallback}`;
  }
  return null;
}

const MAX_SECTION_BYTES = 200_000;

export const GET = withJsonErrors(async function GET() {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const defaults = defaultSiteContent();
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("site_content")
    .select("key,data,updated_at");

  if (error) {
    console.warn("site-content GET:", error.message);
    return NextResponse.json({
      sections: SITE_KEYS.map((key) => ({
        key,
        data: defaults[key],
        overridden: false,
        updated_at: null,
      })),
      migrated: false,
    });
  }

  const overrides = new Map(
    ((data ?? []) as { key: string; data: unknown; updated_at: string }[]).map(
      (r) => [r.key, r],
    ),
  );

  return NextResponse.json({
    sections: SITE_KEYS.map((key) => {
      const row = overrides.get(key);
      return {
        key,
        data: row ? row.data : defaults[key],
        overridden: Boolean(row),
        updated_at: row?.updated_at ?? null,
      };
    }),
    migrated: true,
  });
});

export const PUT = withJsonErrors(async function PUT(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const { key, data } = body as { key?: unknown; data?: unknown };

  if (!isSiteKey(key)) {
    return NextResponse.json({ error: "Seksi tidak dikenal." }, { status: 400 });
  }

  const serialized = JSON.stringify(data ?? null);
  if (serialized.length > MAX_SECTION_BYTES) {
    return NextResponse.json(
      { error: "Konten seksi terlalu besar." },
      { status: 413 },
    );
  }

  const defaults = defaultSiteContent();
  const problem = shapeMatches(defaults[key], data);
  if (problem) {
    return NextResponse.json(
      { error: `Bentuk data tidak sesuai: ${problem}.` },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseAdmin();
  const { data: saved, error } = await supabase
    .from("site_content")
    .upsert(
      { key, data, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    )
    .select("key,updated_at")
    .single();

  if (error) {
    console.error("site-content PUT:", error.message);
    return NextResponse.json(
      { error: "Gagal menyimpan. Pastikan migrasi tahap3.sql sudah dijalankan." },
      { status: 500 },
    );
  }

  invalidate(CACHE_TAGS.siteContent);
  return NextResponse.json({ ok: true, ...saved });
});

export const DELETE = withJsonErrors(async function DELETE(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const key = new URL(req.url).searchParams.get("key");
  if (!isSiteKey(key)) {
    return NextResponse.json({ error: "Seksi tidak dikenal." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const { error } = await supabase.from("site_content").delete().eq("key", key);

  if (error) {
    console.error("site-content DELETE:", error.message);
    return NextResponse.json({ error: "Gagal mereset seksi." }, { status: 500 });
  }

  invalidate(CACHE_TAGS.siteContent);
  return NextResponse.json({ ok: true, data: defaultSiteContent()[key] });
});
