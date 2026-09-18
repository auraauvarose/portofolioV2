import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

// Sitemap dihasilkan ulang tiap jam; datanya dibaca lewat klien publik
// (tanpa cookies) supaya bisa dirender saat build.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/komentar"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];

  // Halaman case study — satu entri per project yang punya slug.
  const slugs = await getProjectSlugs();
  const caseStudies: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: absoluteUrl(`/work/${slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...caseStudies];
}
