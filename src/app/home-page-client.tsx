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
  activeDiscussions: Post[]
}

export function HomePageClient({ initialFeed, stats, discoveryPosts, discoveryLabel, activeDiscussions }: HomePageClientProps) {
  return (
    <FeedPageClient
      initialFeed={initialFeed}
      discoveryPosts={discoveryPosts}
      discoveryLabel={discoveryLabel}
      activeDiscussions={activeDiscussions}
      header={stats ? <HeroSection stats={stats} /> : null}
    />
  )
}
