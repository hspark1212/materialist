"use client"

import type { Post } from "@/lib"
import type { PostsFeedInitialData } from "@/features/posts/domain/feed-initial-data"
import { FeedPageClient } from "@/features/posts/presentation/feed-page-client"
import { HeroSection, type CommunityStats } from "@/components/home/hero-section"

type HomePageClientProps = {
  initialFeed: PostsFeedInitialData
  stats: CommunityStats | null
  todaysPosts: Post[]
}

export function HomePageClient({ initialFeed, stats, todaysPosts }: HomePageClientProps) {
  return (
    <FeedPageClient
      initialFeed={initialFeed}
      todaysPosts={todaysPosts}
      header={stats ? <HeroSection stats={stats} /> : null}
    />
  )
}
