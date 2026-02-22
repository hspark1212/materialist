import "server-only"

import type { ForumFlair, JobType, Section, ShowcaseType } from "@/lib"
import { createClient } from "@/lib/supabase/server"
import type { AuthorType } from "../application/ports"
import { listPostsUseCase } from "../application/use-cases"
import type { PostsFeedInitialData } from "../domain/feed-initial-data"
import {
  normalizeForumFlair,
  normalizeJobType,
  normalizeLocationFilter,
  normalizeSearchQuery,
  normalizeShowcaseType,
  normalizeTag,
} from "../domain/query-normalization"
import type { PostSort } from "../domain/types"
import { createSupabasePostsRepository } from "../infrastructure/supabase-posts-repository"
import { attachUserVotes } from "./attach-user-votes"

export type PageSearchParams = Record<string, string | string[] | undefined>
export type AwaitablePageSearchParams = PageSearchParams | Promise<PageSearchParams> | undefined

const INITIAL_FEED_LIMIT = 12
const INITIAL_FEED_SORT: PostSort = "new"

function parsePagePostSort(value: string | undefined): PostSort {
  if (value === "hot" || value === "new" || value === "top") {
    return value
  }
  return INITIAL_FEED_SORT
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export async function resolvePageSearchParams(searchParams: AwaitablePageSearchParams): Promise<PageSearchParams> {
  return (await searchParams) ?? {}
}

type GetInitialPostsFeedOptions = {
  section?: Section
  searchParams?: PageSearchParams
  limit?: number
  sortBy?: PostSort
  authorType?: AuthorType
}

function buildEmptyInitialFeed(options: {
  section?: Section
  limit: number
  sortBy: PostSort
  tag?: string
  query?: string
  flair?: ForumFlair
  showcaseType?: ShowcaseType
  jobType?: JobType
  location?: string
  authorType?: AuthorType
}): PostsFeedInitialData {
  return {
    prefetched: false,
    posts: [],
    hasMore: false,
    nextOffset: null,
    limit: options.limit,
    sortBy: options.sortBy,
    hotPostIds: [],
    section: options.section,
    tag: options.tag,
    query: options.query,
    flair: options.flair,
    showcaseType: options.showcaseType,
    jobType: options.jobType,
    location: options.location,
    authorType: options.authorType,
  }
}

export async function getInitialPostsFeed({
  section,
  searchParams,
  limit = INITIAL_FEED_LIMIT,
  sortBy,
  authorType,
}: GetInitialPostsFeedOptions): Promise<PostsFeedInitialData> {
  const tag = normalizeTag(firstValue(searchParams?.tag))
  const query = normalizeSearchQuery(firstValue(searchParams?.q))
  const flair = normalizeForumFlair(firstValue(searchParams?.flair))
  const showcaseType = normalizeShowcaseType(firstValue(searchParams?.showcaseType))
  const jobType = normalizeJobType(firstValue(searchParams?.jobType))
  const location = normalizeLocationFilter(firstValue(searchParams?.location))
  const resolvedSortBy = sortBy ?? parsePagePostSort(firstValue(searchParams?.sort))
  const rawAuthorType = firstValue(searchParams?.authorType)
  const resolvedAuthorType =
    authorType ?? (rawAuthorType === "human" ? "human" : rawAuthorType === "bot" ? "bot" : "all")

  try {
    const supabase = await createClient()
    const repository = createSupabasePostsRepository(supabase)
    const [rows, hotPosts] = await Promise.all([
      listPostsUseCase(repository, {
        sort: resolvedSortBy,
        section,
        tag,
        query,
        flair,
        showcaseType,
        jobType,
        location,
        authorType: resolvedAuthorType,
        limit: limit + 1,
        offset: 0,
      }),
      listPostsUseCase(repository, {
        sort: "hot",
        section,
        limit: 10,
        offset: 0,
      }).catch(() => []),
    ])

    const hasMore = rows.length > limit
    const posts = hasMore ? rows.slice(0, limit) : rows

    const postsWithVotes = await attachUserVotes(supabase, posts)
    const hotPostIds = hotPosts.map((p) => p.id)

    return {
      prefetched: true,
      posts: postsWithVotes,
      hasMore,
      nextOffset: hasMore ? limit : null,
      limit,
      sortBy: resolvedSortBy,
      hotPostIds,
      section,
      tag,
      query,
      flair,
      showcaseType,
      jobType,
      location,
      authorType: resolvedAuthorType,
    }
  } catch (error) {
    console.warn("[posts] Failed to load initial feed:", error)
    return buildEmptyInitialFeed({
      section,
      limit,
      sortBy: resolvedSortBy,
      tag,
      query,
      flair,
      showcaseType,
      jobType,
      location,
      authorType: resolvedAuthorType,
    })
  }
}
