import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/seo"
import { createClient } from "@/lib/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at")
    .order("created_at", { ascending: false })
    .limit(50000)

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/papers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/forum`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/showcase`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ]

  const postPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${SITE_URL}/post/${post.id}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...postPages]
}
