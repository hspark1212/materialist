import { Suspense } from "react"

import { ForumPageClient } from "@/app/forum/forum-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

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
