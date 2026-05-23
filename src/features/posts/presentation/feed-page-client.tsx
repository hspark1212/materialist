"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { CalendarDays, MessageSquare, TrendingUp } from "lucide-react"

import { cn, type Post, type Section } from "@/lib"
import { useIdentity } from "@/lib/identity"
import { sectionByKey } from "@/lib/sections"
import { FeedControls, type DiscoveryChip, type FeedSort } from "@/components/feed/feed-controls"
import { FeedList } from "@/components/feed/feed-list"
import { getPostPreviewText } from "@/components/post/post-feed-utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { VoteButton } from "@/components/voting/vote-button"
import { useTrendingPosts } from "@/features/topics/presentation/use-trending-posts"
import type { RecentPostsLabel } from "../server/get-recent-posts"
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
  discoveryPosts?: Post[]
  discoveryLabel?: RecentPostsLabel
  activeDiscussions?: Post[]
}

function parseFeedSort(value: string | null, fallback: FeedSort): FeedSort {
  if (value === "hot" || value === "new" || value === "top") {
    return value
  }
  return fallback
}

function parseDiscoveryChip(value: string | null, fallback: DiscoveryChip): DiscoveryChip {
  if (value === "active" || value === "today" || value === "trending") return value
  return fallback
}

export function FeedPageClient({
  section,
  initialFeed,
  header,
  discoveryPosts,
  discoveryLabel = "today",
  activeDiscussions,
}: FeedPageClientProps) {
  const hasActiveDiscussions = activeDiscussions && activeDiscussions.length > 0
  const hasDiscoveryPosts = discoveryPosts && discoveryPosts.length > 0
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const defaultChip: DiscoveryChip = hasActiveDiscussions ? "active" : hasDiscoveryPosts ? "today" : "trending"
  const discoveryChip = parseDiscoveryChip(searchParams.get("chip"), defaultChip)
  const setDiscoveryChip = useCallback(
    (value: DiscoveryChip | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("chip", value)
      } else {
        params.delete("chip")
      }
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )
  const sortBy = parseFeedSort(searchParams.get("sort"), initialFeed.sortBy)
  const setSortBy = useCallback(
    (value: FeedSort) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "new") {
        params.delete("sort")
      } else {
        params.set("sort", value)
      }
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )
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
    authorType === (initialFeed.authorType ?? "bot")

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
      {discoveryPosts?.length || activeDiscussions?.length ? (
        <DiscoverySection
          chip={discoveryChip}
          onChipChange={setDiscoveryChip}
          discoveryPosts={discoveryPosts ?? []}
          discoveryLabel={discoveryLabel}
          activeDiscussions={activeDiscussions ?? []}
        />
      ) : null}
      {activeQuery ? <ActiveSearchBadge query={activeQuery} onClear={clearQuery} /> : null}
      {activeTag ? <ActiveTagBadge tag={activeTag} onClear={clearTag} /> : null}
      <FeedControls sortBy={sortBy} setSortBy={setSortBy} authorType={authorType} setAuthorType={setAuthorType} />
      {error ? <p className="text-destructive py-2 text-sm">{error}</p> : null}
      {!error && loading ? <p className="text-muted-foreground py-2 text-sm">Loading posts...</p> : null}
      {!error && !loading ? (
        <>
          <FeedList posts={posts} hotPostIds={initialFeed.hotPostIds} />
          {hasMore ? (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loadingMore ? <p className="text-muted-foreground text-sm">Loading more...</p> : null}
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
  discoveryPosts,
  discoveryLabel,
  activeDiscussions,
}: {
  chip: DiscoveryChip
  onChipChange: (chip: DiscoveryChip | null) => void
  discoveryPosts: Post[]
  discoveryLabel: RecentPostsLabel
  activeDiscussions: Post[]
}) {
  const todayChipLabel = discoveryLabel === "recent" ? "Recent" : "Today"
  const hasActive = activeDiscussions.length > 0
  return (
    <div className="space-y-3 pt-3">
      <ToggleGroup
        type="single"
        value={chip ?? ""}
        onValueChange={(value) => onChipChange((value || null) as DiscoveryChip | null)}
        variant="outline"
        size="sm"
      >
        {hasActive && (
          <ToggleGroupItem
            value="active"
            aria-label="Active discussions"
            className={cn(
              "gap-1 px-2 text-[11px]",
              chip === "active" ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "",
            )}
          >
            <MessageSquare className="size-3.5" />
            <span>Active</span>
          </ToggleGroupItem>
        )}
        <ToggleGroupItem
          value="today"
          aria-label={discoveryLabel === "recent" ? "Recent posts" : "Today's posts"}
          className={cn(
            "gap-1 px-2 text-[11px]",
            chip === "today" ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "",
          )}
        >
          <CalendarDays className="size-3.5" />
          <span>{todayChipLabel}</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="trending"
          aria-label="Trending posts"
          className={cn(
            "gap-1 px-2 text-[11px]",
            chip === "trending" ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "",
          )}
        >
          <TrendingUp className="size-3.5" />
          <span className="max-[360px]:hidden">Trending</span>
          <span className="hidden max-[360px]:inline">Trend</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <DiscoveryStrip chip={chip} discoveryPosts={discoveryPosts} activeDiscussions={activeDiscussions} />
    </div>
  )
}

function DiscoveryStrip({
  chip,
  discoveryPosts,
  activeDiscussions,
}: {
  chip: DiscoveryChip
  discoveryPosts: Post[]
  activeDiscussions: Post[]
}) {
  const { posts: trendingPosts } = useTrendingPosts(10, 30)
  const { isAnonymousMode } = useIdentity()

  if (chip === "active" && activeDiscussions.length > 0) {
    return (
      <ScrollStrip>
        {activeDiscussions.map((post) => (
          <DiscoveryCard
            key={post.id}
            postId={post.id}
            href={`/post/${post.id}`}
            title={post.title}
            section={post.section}
            preview={getPostPreviewText(post.content, 120)}
            voteCount={post.voteCount}
            commentCount={post.commentCount}
            userVoteAnonymous={post.userVoteAnonymous ?? 0}
            userVoteVerified={post.userVoteVerified ?? 0}
            isAnonymous={isAnonymousMode}
          />
        ))}
      </ScrollStrip>
    )
  }

  if (chip === "today" && discoveryPosts.length > 0) {
    return (
      <ScrollStrip>
        {discoveryPosts.map((post) => (
          <DiscoveryCard
            key={post.id}
            postId={post.id}
            href={`/post/${post.id}`}
            title={post.title}
            section={post.section}
            preview={getPostPreviewText(post.content, 120)}
            voteCount={post.voteCount}
            userVoteAnonymous={post.userVoteAnonymous ?? 0}
            userVoteVerified={post.userVoteVerified ?? 0}
            isAnonymous={isAnonymousMode}
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
            postId={post.id}
            href={`/post/${post.id}`}
            title={post.title}
            section={post.section}
            preview={getPostPreviewText(post.content, 120)}
            voteCount={post.vote_count}
            userVoteAnonymous={post.user_vote_anonymous ?? 0}
            userVoteVerified={post.user_vote_verified ?? 0}
            isAnonymous={isAnonymousMode}
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
    const onMouseUp = () => {
      dragState.current.active = false
    }
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
        className="scrollbar-hide flex cursor-grab gap-3 overflow-x-auto pb-1.5 active:cursor-grabbing"
      >
        {children}
      </div>
      {thumbRatio < 1 && (
        <div className="bg-border/40 mt-1.5 h-0.5 rounded-full">
          <div
            className="bg-muted-foreground/40 h-full rounded-full transition-[margin-left] duration-100"
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
  postId,
  href,
  title,
  preview,
  section,
  voteCount,
  commentCount,
  userVoteAnonymous = 0,
  userVoteVerified = 0,
  isAnonymous = false,
}: {
  postId: string
  href: string
  title: string
  preview?: string
  section: string
  voteCount: number
  commentCount?: number
  userVoteAnonymous?: -1 | 0 | 1
  userVoteVerified?: -1 | 0 | 1
  isAnonymous?: boolean
}) {
  const meta = sectionByKey[section as Section]
  return (
    <Link
      href={href}
      className="border-border/70 bg-background/70 hover:border-primary/30 flex w-64 shrink-0 flex-col gap-1.5 rounded-xl border p-3 transition-colors sm:w-72 sm:p-3.5"
    >
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta?.color }} />
        {meta?.label}
        <span className="ml-auto flex items-center gap-1.5">
          {commentCount !== undefined && commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="size-3" />
              <span>{commentCount}</span>
            </span>
          )}
          <span onClick={(e) => e.preventDefault()}>
            <VoteButton
              targetType="post"
              targetId={postId}
              initialCount={voteCount}
              initialUserVoteAnonymous={userVoteAnonymous}
              initialUserVoteVerified={userVoteVerified}
              isAnonymous={isAnonymous}
              orientation="horizontal"
              size="sm"
              compact
              countMode="net"
              className="h-6 gap-0.5 px-0.5"
            />
          </span>
        </span>
      </span>
      <span className="line-clamp-2 text-sm leading-snug font-medium">{title}</span>
      {preview ? (
        <span className="text-muted-foreground line-clamp-1 text-xs leading-relaxed">{preview}</span>
      ) : null}
    </Link>
  )
}
