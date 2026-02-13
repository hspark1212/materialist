import "server-only"

import type { Section } from "@/lib"
import { createClient } from "@/lib/supabase/server"
import { listPostsUseCase } from "../application/use-cases"
import type { PostsFeedInitialData } from "../domain/feed-initial-data"
import { normalizeSearchQuery, normalizeTag } from "../domain/query-normalization"
import type { PostSort } from "../domain/types"
import { createSupabasePostsRepository } from "../infrastructure/supabase-posts-repository"

export type PageSearchParams = Record<string, string | string[] | undefined>
export type AwaitablePageSearchParams = PageSearchParams | Promise<PageSearchParams> | undefined

const INITIAL_FEED_LIMIT = 8
const INITIAL_FEED_SORT: PostSort = "hot"

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export async function resolvePageSearchParams(
  searchParams: AwaitablePageSearchParams,
): Promise<PageSearchParams> {
  return (await searchParams) ?? {}
}

type GetInitialPostsFeedOptions = {
  section?: Section
  searchParams?: PageSearchParams
  limit?: number
  sortBy?: PostSort
}

function buildEmptyInitialFeed(options: {
  section?: Section
  limit: number
  sortBy: PostSort
  tag?: string
  query?: string
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
  }
}

export async function getInitialPostsFeed({
  section,
  searchParams,
  limit = INITIAL_FEED_LIMIT,
  sortBy = INITIAL_FEED_SORT,
}: GetInitialPostsFeedOptions): Promise<PostsFeedInitialData> {
  const tag = normalizeTag(firstValue(searchParams?.tag))
  const query = normalizeSearchQuery(firstValue(searchParams?.q))

  try {
    const supabase = await createClient()
    const repository = createSupabasePostsRepository(supabase)
    const rows = await listPostsUseCase(repository, {
      sort: sortBy,
      section,
      tag,
      query,
      limit: limit + 1,
      offset: 0,
    })

    const hasMore = rows.length > limit
    const posts = hasMore ? rows.slice(0, limit) : rows

    return {
      prefetched: true,
      posts,
      hasMore,
      nextOffset: hasMore ? limit : null,
      limit,
      sortBy,
      section,
      tag,
      query,
    }
  } catch (error) {
    console.warn("[posts] Failed to load initial feed:", error)
    return buildEmptyInitialFeed({ section, limit, sortBy, tag, query })
  }
}
