import type { MetadataRoute } from "next"

import { getSiteUrl, INDEXABLE_PATHS } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()

  return INDEXABLE_PATHS.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }))
}
