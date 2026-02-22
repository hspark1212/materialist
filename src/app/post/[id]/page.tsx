import type { Metadata } from "next"

import type { Section } from "@/lib"
import { SITE_URL, SITE_NAME } from "@/lib/seo"
import { getSectionLabel } from "@/lib/sections"
import { getPostMetadata } from "@/features/posts/server/get-post-metadata"
import { PostJsonLd } from "@/components/seo/post-json-ld"
import { PostDetailPageClient } from "./post-detail-page-client"

type PageProps = {
  params: Promise<{ id: string }>
}

function resolveAuthorName(
  profile: { display_name: string; is_anonymous: boolean; generated_display_name: string | null } | null,
  postIsAnonymous: boolean,
): string {
  if (!profile) return "Anonymous"
  if (postIsAnonymous) return profile.generated_display_name ?? "Anonymous"
  return profile.display_name ?? "Anonymous"
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getPostMetadata(id)

  if (!post) {
    return { title: "Post Not Found" }
  }

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  const authorName = resolveAuthorName(profile, post.is_anonymous)
  const description = post.content.slice(0, 160).replace(/\n/g, " ").trim()
  const sectionLabel = getSectionLabel(post.section as Section)
  const title = `${post.title} — ${sectionLabel}`
  const canonicalUrl = `${SITE_URL}/post/${post.id}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [authorName],
      tags: post.tags ?? undefined,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const post = await getPostMetadata(id)

  if (!post) {
    return <PostDetailPageClient />
  }

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  const authorName = resolveAuthorName(profile, post.is_anonymous)
  const description = post.content.slice(0, 160).replace(/\n/g, " ").trim()

  return (
    <>
      <PostJsonLd
        post={{
          id: post.id,
          title: post.title,
          description,
          authorName,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          commentCount: post.comment_count,
          tags: post.tags ?? [],
        }}
      />
      <PostDetailPageClient />
    </>
  )
}
