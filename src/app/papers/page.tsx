"use client"

import { Suspense, useState } from "react"

import { sectionByKey } from "@/lib/sections"
import { FeedControls, type FeedSort } from "@/components/feed/feed-controls"
import { FeedList } from "@/components/feed/feed-list"
import { useFeedViewMode } from "@/components/feed/use-feed-view-mode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ActiveSearchBadge } from "@/features/posts/presentation/active-search-badge"
import { ActiveTagBadge } from "@/features/posts/presentation/active-tag-badge"
import { usePostsFeed } from "@/features/posts/presentation/use-posts-feed"
import { useSearchFilter } from "@/features/posts/presentation/use-search-filter"
import { useTagFilter } from "@/features/posts/presentation/use-tag-filter"

const meta = sectionByKey["papers"]

function PapersContent() {
  const [sortBy, setSortBy] = useState<FeedSort>("hot")
  const { viewMode, setViewMode } = useFeedViewMode("card")
  const { activeTag, clearTag } = useTagFilter()
  const { activeQuery, clearQuery } = useSearchFilter()
  const { posts, loading, loadingMore, error, hasMore, loadMore } = usePostsFeed({
    section: "papers",
    sortBy,
    tag: activeTag,
    query: activeQuery,
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card className="overflow-hidden border-[var(--section-papers)]/20 py-0">
        <CardContent className="px-4 py-5 sm:px-6" style={{ backgroundImage: "linear-gradient(120deg, color-mix(in srgb, var(--section-papers) 20%, transparent) 0%, transparent 68%)" }}>
          <div className="flex items-center gap-3">
            <meta.icon className="size-8 text-[var(--section-papers)]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{meta.label}</h1>
              <p className="text-muted-foreground text-sm">{meta.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {activeQuery ? <ActiveSearchBadge query={activeQuery} onClear={clearQuery} /> : null}
      {activeTag ? <ActiveTagBadge tag={activeTag} onClear={clearTag} /> : null}
      <FeedControls sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} />
      {error ? <p className="text-destructive py-2 text-sm">{error}</p> : null}
      {!error && loading ? <p className="text-muted-foreground py-2 text-sm">Loading posts...</p> : null}
      {!error && !loading ? (
        <>
          <FeedList posts={posts} viewMode={viewMode} />
          {hasMore ? (
            <div className="flex justify-center py-6">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default function PapersPage() {
  return (
    <Suspense>
      <PapersContent />
    </Suspense>
  )
}
