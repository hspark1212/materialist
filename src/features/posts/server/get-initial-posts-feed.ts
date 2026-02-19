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

export type PageSearchParams = Record<string, string | string[] | undefined>
export type AwaitablePageSearchParams = PageSearchParams | Promise<PageSearchParams> | undefined

const INITIAL_FEED_LIMIT = 12
const INITIAL_FEED_SORT: PostSort = "new"

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
  sortBy = INITIAL_FEED_SORT,
  authorType,
}: GetInitialPostsFeedOptions): Promise<PostsFeedInitialData> {
  const tag = normalizeTag(firstValue(searchParams?.tag))
  const query = normalizeSearchQuery(firstValue(searchParams?.q))
  const flair = normalizeForumFlair(firstValue(searchParams?.flair))
  const showcaseType = normalizeShowcaseType(firstValue(searchParams?.showcaseType))
  const jobType = normalizeJobType(firstValue(searchParams?.jobType))
  const location = normalizeLocationFilter(firstValue(searchParams?.location))
  const rawAuthorType = firstValue(searchParams?.authorType)
  const resolvedAuthorType =
    authorType ?? (rawAuthorType === "human" ? "human" : rawAuthorType === "bot" ? "bot" : "all")

  try {
    const supabase = await createClient()
    const repository = createSupabasePostsRepository(supabase)
    const rows = await listPostsUseCase(repository, {
      sort: sortBy,
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
    })

    const hasMore = rows.length > limit
    const posts = hasMore ? rows.slice(0, limit) : rows

    // Attach vote state for authenticated users so SSR data includes userVote
    let postsWithVotes = posts
    if (posts.length > 0) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const postIds = posts.map((p) => p.id)
          const { data: votes } = await supabase
            .from("votes")
            .select("target_id,vote_direction")
            .eq("user_id", user.id)
            .eq("target_type", "post")
            .in("target_id", postIds)

          if (votes && votes.length > 0) {
            const voteMap = new Map(votes.map((v) => [v.target_id, v.vote_direction]))
            postsWithVotes = posts.map((p) => ({
              ...p,
              userVote: (voteMap.get(p.id) ?? 0) as -1 | 0 | 1,
            }))
          }
        }
      } catch {
        // Graceful degradation: return posts without vote state
      }
    }

    return {
      prefetched: true,
      posts: postsWithVotes,
      hasMore,
      nextOffset: hasMore ? limit : null,
      limit,
      sortBy,
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
      sortBy,
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
