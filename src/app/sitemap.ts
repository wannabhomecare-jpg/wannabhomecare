import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";
import { SERVICE_KEYS } from "@/lib/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...SERVICE_KEYS.map((slug) => ({ url: `${base}/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
