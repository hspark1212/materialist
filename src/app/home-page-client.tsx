"use client"

import type { PostsFeedInitialData } from "@/features/posts/domain/feed-initial-data"
import { FeedPageClient } from "@/features/posts/presentation/feed-page-client"

type HomePageClientProps = {
  initialFeed: PostsFeedInitialData
}

export function HomePageClient({ initialFeed }: HomePageClientProps) {
  return <FeedPageClient initialFeed={initialFeed} />
}
