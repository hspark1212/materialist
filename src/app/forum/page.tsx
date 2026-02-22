import { Suspense } from "react"
import type { Metadata } from "next"

import { ForumPageClient } from "@/app/forum/forum-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

export const metadata: Metadata = {
  title: "Forum",
  description: "Free discussion — questions, career advice, news, and community topics in materials science and AI.",
  alternates: { canonical: "/forum" },
}

type ForumPageProps = {
  searchParams?: AwaitablePageSearchParams
}

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const resolvedSearchParams = await resolvePageSearchParams(searchParams)
  const initialFeed = await getInitialPostsFeed({
    section: "forum",
    searchParams: resolvedSearchParams,
  })

  return (
    <Suspense>
      <ForumPageClient initialFeed={initialFeed} />
    </Suspense>
  )
}
