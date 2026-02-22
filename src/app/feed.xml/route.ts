import { createClient } from "@/lib/supabase/server"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo"

const FEED_LIMIT = 50

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export async function GET() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, content, section, is_anonymous, created_at, profiles(display_name, is_anonymous, generated_display_name)")
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT)

  const items = (posts ?? [])
    .map((post) => {
      const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
      const authorName = post.is_anonymous
        ? (profile?.generated_display_name ?? "Anonymous")
        : (profile?.display_name ?? "Anonymous")
      const description = post.content.slice(0, 300).replace(/\n/g, " ").trim()

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/post/${post.id}</link>
      <guid isPermaLink="true">${SITE_URL}/post/${post.id}</guid>
      <description>${escapeXml(description)}</description>
      <author>${escapeXml(authorName)}</author>
      <category>${escapeXml(post.section)}</category>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
