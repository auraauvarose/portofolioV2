import type { MetadataRoute } from "next";
import { getProjectSitemapEntries } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

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

  const entries = await getProjectSitemapEntries();
  const caseStudies: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: absoluteUrl(`/work/${entry.slug}`),
    lastModified: entry.lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...caseStudies];
}
