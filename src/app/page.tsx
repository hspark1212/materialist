"use client"

import { Suspense, useState } from "react"

import type { Section } from "@/lib"
import { sections } from "@/lib/sections"
import { FeedControls, type FeedSort } from "@/components/feed/feed-controls"
import { FeedList } from "@/components/feed/feed-list"
import { useFeedViewMode } from "@/components/feed/use-feed-view-mode"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ActiveSearchBadge } from "@/features/posts/presentation/active-search-badge"
import { ActiveTagBadge } from "@/features/posts/presentation/active-tag-badge"
import { usePostsFeed } from "@/features/posts/presentation/use-posts-feed"
import { useSearchFilter } from "@/features/posts/presentation/use-search-filter"
import { useTagFilter } from "@/features/posts/presentation/use-tag-filter"

function HomeContent() {
  const [sortBy, setSortBy] = useState<FeedSort>("hot")
  const { viewMode, setViewMode } = useFeedViewMode("card")
  const [activeSection, setActiveSection] = useState<Section | "all">("all")
  const { activeTag, clearTag } = useTagFilter()
  const { activeQuery, clearQuery } = useSearchFilter()

  const { posts, loading, loadingMore, error, hasMore, loadMore } = usePostsFeed({
    section: activeSection === "all" ? undefined : activeSection,
    sortBy,
    tag: activeTag,
    query: activeQuery,
  })

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:px-0">
        <Badge variant={activeSection === "all" ? "default" : "secondary"} className="cursor-pointer text-xs" onClick={() => setActiveSection("all")}>All</Badge>
        {sections.map((s) => (
          <Badge key={s.key} variant={activeSection === s.key ? "default" : "secondary"} className="cursor-pointer text-xs" onClick={() => setActiveSection(s.key)}>{s.label}</Badge>
        ))}
      </div>
      {activeQuery ? <ActiveSearchBadge query={activeQuery} onClear={clearQuery} /> : null}
      {activeTag ? <ActiveTagBadge tag={activeTag} onClear={clearTag} /> : null}
      <FeedControls
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      {error ? (
        <p className="text-destructive py-4 text-sm">{error}</p>
      ) : null}
      {!error && loading ? (
        <p className="text-muted-foreground py-4 text-sm">Loading posts...</p>
      ) : null}
      {!error && !loading ? (
        <>
          <FeedList posts={posts} viewMode={viewMode} />
          {hasMore ? (
            <div className="flex justify-center py-6">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
