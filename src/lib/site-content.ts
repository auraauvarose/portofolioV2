import { CACHE_TAGS, createSupabasePublic } from "@/lib/supabase/public";
import * as defaults from "@/lib/config";
import type { SiteContentKey } from "@/types";
import type { nav as defaultNav } from "@/lib/config";

export type SiteContent = {
  nav: typeof defaultNav;
  profile: typeof defaults.profile;
  hero: typeof defaults.hero;
  about: typeof defaults.about;
  whatIDo: typeof defaults.whatIDo;
  education: typeof defaults.education;
  techStack: typeof defaults.techStack;
};

export function defaultSiteContent(): SiteContent {
  return {
    nav: defaults.nav,
    profile: defaults.profile,
    hero: defaults.hero,
    about: defaults.about,
    whatIDo: defaults.whatIDo,
    education: defaults.education,
    techStack: defaults.techStack,
  };
}

function mergeSection<T extends object>(fallback: T, override: unknown): T {
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    return fallback;
  }
  return { ...fallback, ...(override as Partial<T>) };
}

export async function getSiteContent(): Promise<SiteContent> {
  const base = defaultSiteContent();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return base;

  try {
    const supabase = createSupabasePublic(CACHE_TAGS.siteContent);
    const { data, error } = await supabase
      .from("site_content")
      .select("key,data");

    if (error) {
      console.warn("getSiteContent: memakai default —", error.message);
      return base;
    }

    for (const row of (data ?? []) as { key: string; data: unknown }[]) {
      if (row.key in base) {
        const key = row.key as SiteContentKey;
        // @ts-expect-error — key sudah dipersempit ke kunci SiteContent yang sah
        base[key] = mergeSection(base[key], row.data);
      }
    }
    return base;
  } catch (err) {
    console.warn("getSiteContent: memakai default —", err);
    return base;
  }
}

export async function getSiteSection<K extends SiteContentKey>(
  key: K,
): Promise<SiteContent[K]> {
  const all = await getSiteContent();
  return all[key];
}
