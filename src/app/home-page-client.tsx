"use client"

import type { Post } from "@/lib"
import type { PostsFeedInitialData } from "@/features/posts/domain/feed-initial-data"
import type { RecentPostsLabel } from "@/features/posts/server/get-recent-posts"
import { FeedPageClient } from "@/features/posts/presentation/feed-page-client"
import { HeroSection, type CommunityStats } from "@/components/home/hero-section"

type HomePageClientProps = {
  initialFeed: PostsFeedInitialData
  stats: CommunityStats | null
  discoveryPosts: Post[]
  discoveryLabel: RecentPostsLabel
}

export function HomePageClient({ initialFeed, stats, discoveryPosts, discoveryLabel }: HomePageClientProps) {
  return (
    <FeedPageClient
      initialFeed={initialFeed}
      discoveryPosts={discoveryPosts}
      discoveryLabel={discoveryLabel}
      header={stats ? <HeroSection stats={stats} /> : null}
    />
  )
}
