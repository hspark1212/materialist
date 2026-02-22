import { SITE_NAME, SITE_URL } from "@/lib/seo"

type PostJsonLdProps = {
  post: {
    id: string
    title: string
    description: string
    authorName: string
    createdAt: string
    updatedAt: string
    commentCount: number
    tags: string[]
  }
}

export function PostJsonLd({ post }: PostJsonLdProps) {
  const url = `${SITE_URL}/post/${post.id}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Person", name: post.authorName },
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    url,
    publisher: { "@type": "Organization", name: SITE_NAME },
    commentCount: post.commentCount,
    keywords: post.tags,
    isAccessibleForFree: true,
    mainEntityOfPage: url,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  )
}
