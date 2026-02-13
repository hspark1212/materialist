"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import type { Section } from "@/lib"
import { FeedControls, type FeedSort } from "@/components/feed/feed-controls"
import { FeedList } from "@/components/feed/feed-list"
import { useFeedViewMode } from "@/components/feed/use-feed-view-mode"
import type { PostsFeedInitialData } from "../domain/feed-initial-data"
import { normalizeTag } from "../domain/query-normalization"
import { ActiveSearchBadge } from "./active-search-badge"
import { ActiveTagBadge } from "./active-tag-badge"
import { usePostsFeed } from "./use-posts-feed"
import { useSearchFilter } from "./use-search-filter"
import { useTagFilter } from "./use-tag-filter"

type FeedPageClientProps = {
  section?: Section
  initialFeed: PostsFeedInitialData
  header?: ReactNode
}

export function FeedPageClient({ section, initialFeed, header }: FeedPageClientProps) {
  const [sortBy, setSortBy] = useState<FeedSort>(initialFeed.sortBy)
  const { viewMode, setViewMode } = useFeedViewMode("card")
  const { activeTag, clearTag } = useTagFilter()
  const { activeQuery, clearQuery } = useSearchFilter()
  const normalizedTag = normalizeTag(activeTag)

  const shouldUseInitialData =
    initialFeed.prefetched &&
    sortBy === initialFeed.sortBy &&
    normalizedTag === initialFeed.tag &&
    activeQuery === initialFeed.query

  const { posts, loading, loadingMore, error, hasMore, loadMore } = usePostsFeed({
    section,
    sortBy,
    tag: normalizedTag,
    query: activeQuery,
    limit: initialFeed.limit,
    initialData: shouldUseInitialData ? initialFeed : undefined,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {header}
      {activeQuery ? <ActiveSearchBadge query={activeQuery} onClear={clearQuery} /> : null}
      {activeTag ? <ActiveTagBadge tag={activeTag} onClear={clearTag} /> : null}
      <FeedControls sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} />
      {error ? <p className="text-destructive py-2 text-sm">{error}</p> : null}
      {!error && loading ? <p className="text-muted-foreground py-2 text-sm">Loading posts...</p> : null}
      {!error && !loading ? (
        <>
          <FeedList posts={posts} viewMode={viewMode} />
          {hasMore ? (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loadingMore ? (
                <p className="text-muted-foreground text-sm">Loading more...</p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
