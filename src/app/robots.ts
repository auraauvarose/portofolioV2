import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Panel admin & API tidak boleh diindeks. Halaman login admin pun
        // tidak ada gunanya di hasil pencarian.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: absoluteUrl("/"),
  };
}
