"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"

import { CalendarDays, TrendingUp } from "lucide-react"

import { cn, type Post, type Section } from "@/lib"
import { sectionByKey } from "@/lib/sections"
import { FeedControls, type DiscoveryChip, type FeedSort } from "@/components/feed/feed-controls"
import { FeedList } from "@/components/feed/feed-list"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useTrendingPosts } from "@/features/topics/presentation/use-trending-posts"
import type { PostsFeedInitialData } from "../domain/feed-initial-data"
import {
  normalizeForumFlair,
  normalizeJobType,
  normalizeLocationFilter,
  normalizeShowcaseType,
  normalizeTag,
} from "../domain/query-normalization"
import { ActiveSearchBadge } from "./active-search-badge"
import { ActiveTagBadge } from "./active-tag-badge"
import { useAuthorTypeFilter } from "./use-author-type-filter"
import { usePostsFeed } from "./use-posts-feed"
import { useSearchFilter } from "./use-search-filter"
import { useTagFilter } from "./use-tag-filter"

type FeedPageClientProps = {
  section?: Section
  initialFeed: PostsFeedInitialData
  header?: ReactNode
  todaysPosts?: Post[]
}

export function FeedPageClient({ section, initialFeed, header, todaysPosts }: FeedPageClientProps) {
  const [sortBy, setSortBy] = useState<FeedSort>(initialFeed.sortBy)
  const [discoveryChip, setDiscoveryChip] = useState<DiscoveryChip | null>(todaysPosts ? "today" : null)
  const searchParams = useSearchParams()
  const { activeTag, clearTag } = useTagFilter()
  const { activeQuery, clearQuery } = useSearchFilter()
  const { authorType, setAuthorType } = useAuthorTypeFilter()
  const normalizedTag = normalizeTag(activeTag)
  const activeFlair = normalizeForumFlair(searchParams.get("flair"))
  const activeShowcaseType = normalizeShowcaseType(searchParams.get("showcaseType"))
  const activeJobType = normalizeJobType(searchParams.get("jobType"))
  const activeLocation = normalizeLocationFilter(searchParams.get("location"))

  const shouldUseInitialData =
    initialFeed.prefetched &&
    sortBy === initialFeed.sortBy &&
    normalizedTag === initialFeed.tag &&
    activeQuery === initialFeed.query &&
    activeFlair === initialFeed.flair &&
    activeShowcaseType === initialFeed.showcaseType &&
    activeJobType === initialFeed.jobType &&
    activeLocation === initialFeed.location &&
    authorType === (initialFeed.authorType ?? "all")

  const { posts, loading, loadingMore, error, hasMore, loadMore } = usePostsFeed({
    section,
    sortBy,
    tag: normalizedTag,
    query: activeQuery,
    flair: activeFlair,
    showcaseType: activeShowcaseType,
    jobType: activeJobType,
    location: activeLocation,
    authorType,
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
      {todaysPosts ? (
        <DiscoverySection chip={discoveryChip} onChipChange={setDiscoveryChip} todaysPosts={todaysPosts} />
      ) : null}
      {activeQuery ? <ActiveSearchBadge query={activeQuery} onClear={clearQuery} /> : null}
      {activeTag ? <ActiveTagBadge tag={activeTag} onClear={clearTag} /> : null}
      <FeedControls
        sortBy={sortBy}
        setSortBy={setSortBy}
        authorType={authorType}
        setAuthorType={setAuthorType}
      />
      {error ? <p className="text-destructive py-2 text-sm">{error}</p> : null}
      {!error && loading ? <p className="text-muted-foreground py-2 text-sm">Loading posts...</p> : null}
      {!error && !loading ? (
        <>
          <FeedList posts={posts} />
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

function DiscoverySection({
  chip,
  onChipChange,
  todaysPosts,
}: {
  chip: DiscoveryChip | null
  onChipChange: (chip: DiscoveryChip | null) => void
  todaysPosts: Post[]
}) {
  return (
    <div className="space-y-3 pt-3">
      <ToggleGroup
        type="single"
        value={chip ?? ""}
        onValueChange={(value) => onChipChange((value || null) as DiscoveryChip | null)}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem
          value="today"
          aria-label="Today's posts"
          className={cn(
            "gap-1 px-2 text-[11px]",
            chip === "today"
              ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
              : ""
          )}
        >
          <CalendarDays className="size-3.5" />
          <span>Today</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="trending"
          aria-label="Trending posts"
          className={cn(
            "gap-1 px-2 text-[11px]",
            chip === "trending"
              ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
              : ""
          )}
        >
          <TrendingUp className="size-3.5" />
          <span className="max-[360px]:hidden">Trending</span>
          <span className="hidden max-[360px]:inline">Trend</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <DiscoveryStrip chip={chip} todaysPosts={todaysPosts} />
    </div>
  )
}

function DiscoveryStrip({
  chip,
  todaysPosts,
}: {
  chip: DiscoveryChip | null
  todaysPosts: Post[]
}) {
  const { posts: trendingPosts } = useTrendingPosts(5, 30)

  if (chip === "today" && todaysPosts.length > 0) {
    return (
      <ScrollStrip>
        {todaysPosts.map((post) => (
          <DiscoveryCard
            key={post.id}
            href={`/post/${post.id}`}
            title={post.title}
            section={post.section}
          />
        ))}
      </ScrollStrip>
    )
  }

  if (chip === "trending" && trendingPosts.length > 0) {
    return (
      <ScrollStrip>
        {trendingPosts.map((post) => (
          <DiscoveryCard
            key={post.id}
            href={`/post/${post.id}`}
            title={post.title}
            section={post.section}
            voteCount={post.vote_count}
          />
        ))}
      </ScrollStrip>
    )
  }

  return null
}

function ScrollStrip({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [thumbRatio, setThumbRatio] = useState(1)
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })

  const updateScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setScrollProgress(maxScroll > 0 ? el.scrollLeft / maxScroll : 0)
    setThumbRatio(el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement sync
    updateScroll()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(updateScroll)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateScroll])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    e.preventDefault()
    dragState.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false }
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const s = dragState.current
      if (!s.active) return
      const el = scrollRef.current
      if (!el) return
      const dx = e.pageX - s.startX
      if (Math.abs(dx) > 3) s.moved = true
      el.scrollLeft = s.scrollLeft - dx
    }
    const onMouseUp = () => { dragState.current.active = false }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  return (
    <div className="-mt-2">
      <div
        ref={scrollRef}
        onScroll={updateScroll}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
        className="flex cursor-grab gap-2 overflow-x-auto scrollbar-hide pb-1 active:cursor-grabbing"
      >
        {children}
      </div>
      {thumbRatio < 1 && (
        <div className="mt-1.5 h-0.5 rounded-full bg-border/40">
          <div
            className="h-full rounded-full bg-muted-foreground/40 transition-[margin-left] duration-100"
            style={{
              width: `${thumbRatio * 100}%`,
              marginLeft: `${scrollProgress * (1 - thumbRatio) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}

function DiscoveryCard({
  href,
  title,
  section,
  voteCount,
}: {
  href: string
  title: string
  section: string
  voteCount?: number
}) {
  const meta = sectionByKey[section as Section]
  return (
    <Link
      href={href}
      className="flex w-52 shrink-0 flex-col gap-1 rounded-lg border border-border/70 bg-background/70 p-2.5 transition-colors hover:border-primary/30"
    >
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span
          className="inline-block size-2 shrink-0 rounded-full"
          style={{ backgroundColor: meta?.color }}
        />
        {meta?.label}
        {voteCount != null && (
          <span className="ml-auto">{voteCount} votes</span>
        )}
      </span>
      <span className="line-clamp-2 text-sm leading-snug">{title}</span>
    </Link>
  )
}
