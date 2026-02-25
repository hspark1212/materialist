import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  CommentSort,
  CommentWithAuthorRow,
  PersistedVoteDirection,
  PostWithAuthorRow,
  VoteDirection,
  VoteTargetType,
} from "../domain/types"
import type { ListPostsParams, PostsRepository } from "../application/ports"

// Only fetch profile fields needed for post/comment rendering.
// PII fields (bio, orcid_id, etc.) are fetched separately
// by the profile page via select("*").
const PROFILE_COLUMNS = [
  "id",
  "username",
  "display_name",
  "generated_display_name",
  "avatar_url",
  "karma",
  "is_anonymous",
  "is_bot",
  "created_at",
  "orcid_verified_at",
].join(",")

// Full columns for detail view (includes content)
const POST_COLUMNS_FULL = [
  "id",
  "title",
  "content",
  "author_id",
  "section",
  "type",
  "tags",
  "is_anonymous",
  "vote_count",
  "comment_count",
  "doi",
  "arxiv_id",
  "url",
  "flair",
  "project_url",
  "tech_stack",
  "showcase_type",
  "company",
  "location",
  "job_type",
  "application_url",
  "deadline",
  "created_at",
  "updated_at",
  "last_comment_at",
].join(",")

// Columns for feed cards (include content for inline preview rendering)
const POST_COLUMNS_LIST = [
  "id",
  "title",
  "content",
  "author_id",
  "section",
  "type",
  "tags",
  "is_anonymous",
  "vote_count",
  "comment_count",
  "doi",
  "arxiv_id",
  "url",
  "flair",
  "project_url",
  "tech_stack",
  "showcase_type",
  "company",
  "location",
  "job_type",
  "application_url",
  "deadline",
  "created_at",
  "updated_at",
  "last_comment_at",
].join(",")

const COMMENT_COLUMNS = [
  "id",
  "content",
  "author_id",
  "post_id",
  "parent_comment_id",
  "depth",
  "is_anonymous",
  "vote_count",
  "created_at",
  "updated_at",
].join(",")

export const POSTS_SELECT_LIST = `${POST_COLUMNS_LIST},profiles(${PROFILE_COLUMNS})`
export const POSTS_SELECT_LIST_INNER = `${POST_COLUMNS_LIST},profiles!inner(${PROFILE_COLUMNS})`
const POSTS_SELECT_DETAIL = `${POST_COLUMNS_FULL},profiles(${PROFILE_COLUMNS})`
const COMMENTS_SELECT = `${COMMENT_COLUMNS},profiles(${PROFILE_COLUMNS})`
const HOT_RECENT_WINDOW_DAYS = 7

type SearchPostIdRow = {
  post_id: string
  rank: number
  created_at: string
  vote_count: number
}

function normalizePositiveInteger(value: number | undefined, fallback: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  const normalized = Math.floor(value)
  if (normalized < 0) return fallback
  return Math.min(normalized, max)
}

function getTargetTable(targetType: VoteTargetType): "posts" | "comments" {
  return targetType === "post" ? "posts" : "comments"
}

function throwIfError(error: { message: string } | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

export function createSupabasePostsRepository(supabase: SupabaseClient): PostsRepository {
  function buildListPostsQuery(params: ListPostsParams, options?: { head?: boolean }) {
    const isHead = options?.head === true

    // Use inner join when filtering by author type (human or bot)
    let query =
      params.authorType === "all"
        ? isHead
          ? supabase.from("posts").select(POSTS_SELECT_LIST, { count: "exact", head: true })
          : supabase.from("posts").select(POSTS_SELECT_LIST)
        : isHead
          ? supabase.from("posts").select(POSTS_SELECT_LIST_INNER, { count: "exact", head: true })
          : supabase.from("posts").select(POSTS_SELECT_LIST_INNER)

    if (params.section) {
      query = query.eq("section", params.section)
    }

    if (params.authorId) {
      query = query.eq("author_id", params.authorId)
    }

    if (params.tag) {
      // Support both canonical and legacy tag representations by using an OR on contains
      // Attempt to leverage PostgREST OR syntax for array contains on the same field.
      // This avoids a separate migration and keeps existing behavior intact.
      const tagValue = params.tag
      query = query.or(`tags.contains.{${tagValue}},tags.contains.{#${tagValue}}`)
    }
    if (params.flair) {
      query = query.eq("flair", params.flair)
    }
    if (params.showcaseType) {
      query = query.eq("showcase_type", params.showcaseType)
    }
    if (params.jobType) {
      query = query.eq("job_type", params.jobType)
    }
    if (params.location) {
      query = query.ilike("location", `%${params.location}%`)
    }

    // Filter by author type (human is default, "all" skips filter)
    if (params.authorType === "bot") {
      query = query.eq("profiles.is_bot", true)
    } else if (params.authorType !== "all") {
      query = query.eq("profiles.is_bot", false)
    }

    return query
  }

  function getHotRecentCutoffIso(): string {
    const now = Date.now()
    return new Date(now - HOT_RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  }

  async function listHotPostsWithRecentWindow(
    params: ListPostsParams,
    limit: number,
    offset: number,
  ): Promise<PostWithAuthorRow[]> {
    const cutoffIso = getHotRecentCutoffIso()

    const recentCountQuery = buildListPostsQuery(params, { head: true }).gte("created_at", cutoffIso)
    const { count, error: recentCountError } = await recentCountQuery
    throwIfError(recentCountError, "Failed to count recent hot posts")
    const recentCount = count ?? 0

    const rows: PostWithAuthorRow[] = []

    if (offset < recentCount) {
      const recentLimit = Math.min(limit, recentCount - offset)

      const recentQuery = buildListPostsQuery(params, { head: false })
        .gte("created_at", cutoffIso)
        .order("comment_count", { ascending: false })
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + recentLimit - 1)

      const { data: recentRows, error: recentError } = await recentQuery
      throwIfError(recentError, "Failed to list recent hot posts")
      rows.push(...((recentRows ?? []) as unknown as PostWithAuthorRow[]))

      const remaining = limit - rows.length
      if (remaining <= 0) {
        return rows
      }

      const olderQuery = buildListPostsQuery(params, { head: false })
        .lt("created_at", cutoffIso)
        .order("comment_count", { ascending: false })
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, remaining - 1)

      const { data: olderRows, error: olderError } = await olderQuery
      throwIfError(olderError, "Failed to list older hot posts")
      rows.push(...((olderRows ?? []) as unknown as PostWithAuthorRow[]))

      return rows
    }

    const olderOffset = offset - recentCount
    const olderQuery = buildListPostsQuery(params, { head: false })
      .lt("created_at", cutoffIso)
      .order("comment_count", { ascending: false })
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false })
      .range(olderOffset, olderOffset + limit - 1)

    const { data: olderRows, error: olderError } = await olderQuery
    throwIfError(olderError, "Failed to list older hot posts")
    return (olderRows ?? []) as unknown as PostWithAuthorRow[]
  }

  async function listPostsBySearch(
    params: ListPostsParams,
    limit: number,
    offset: number,
  ): Promise<PostWithAuthorRow[]> {
    const query = params.query?.trim()
    if (!query) return []

    const { data: searchRows, error: searchError } = await supabase.rpc("search_post_ids", {
      p_query: query,
      p_section: params.section ?? null,
      p_author_id: params.authorId ?? null,
      p_tag: params.tag ?? null,
      p_author_type: params.authorType ?? null,
      p_sort: params.sort,
      p_limit: limit,
      p_offset: offset,
    })

    throwIfError(searchError, "Failed to search posts")

    const ids = ((searchRows ?? []) as SearchPostIdRow[]).map((row) => row.post_id)
    if (!ids.length) return []

    let postsQuery = supabase.from("posts").select(POSTS_SELECT_LIST).in("id", ids)

    if (params.flair) {
      postsQuery = postsQuery.eq("flair", params.flair)
    }
    if (params.showcaseType) {
      postsQuery = postsQuery.eq("showcase_type", params.showcaseType)
    }
    if (params.jobType) {
      postsQuery = postsQuery.eq("job_type", params.jobType)
    }
    if (params.location) {
      postsQuery = postsQuery.ilike("location", `%${params.location}%`)
    }

    const { data, error } = await postsQuery
    throwIfError(error, "Failed to load search results")

    const orderById = new Map(ids.map((id, index) => [id, index]))
    const rows = ((data ?? []) as unknown as PostWithAuthorRow[]).sort((left, right) => {
      return (orderById.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (orderById.get(right.id) ?? Number.MAX_SAFE_INTEGER)
    })

    return rows
  }

  return {
    async listPosts(params: ListPostsParams): Promise<PostWithAuthorRow[]> {
      const limit = Math.max(1, normalizePositiveInteger(params.limit, 20, 101))
      const offset = normalizePositiveInteger(params.offset, 0, 10_000)

      if (params.query) {
        return listPostsBySearch(params, limit, offset)
      }

      if (params.sort === "hot" && !params.sinceDate) {
        return listHotPostsWithRecentWindow(params, limit, offset)
      }

      let query = buildListPostsQuery(params, { head: false })

      if (params.sinceDate) {
        query = query.gte("created_at", params.sinceDate)
      }

      if (params.sort === "new") {
        query = query.order("created_at", { ascending: false })
      } else if (params.sort === "top") {
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
      } else {
        query = query
          .order("comment_count", { ascending: false })
          .order("vote_count", { ascending: false })
          .order("created_at", { ascending: false })
      }

      const { data, error } = await query.range(offset, offset + limit - 1)
      throwIfError(error, "Failed to list posts")

      return (data ?? []) as unknown as PostWithAuthorRow[]
    },

    async getPostById(postId: string): Promise<PostWithAuthorRow | null> {
      const { data, error } = await supabase.from("posts").select(POSTS_SELECT_DETAIL).eq("id", postId).maybeSingle()

      throwIfError(error, "Failed to load post")

      return (data as unknown as PostWithAuthorRow | null) ?? null
    },

    async createPost(payload) {
      const { data, error } = await supabase.from("posts").insert(payload).select(POSTS_SELECT_DETAIL).single()

      throwIfError(error, "Failed to create post")
      return data as unknown as PostWithAuthorRow
    },

    async updatePost(postId, authorId, payload) {
      const { data, error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", postId)
        .eq("author_id", authorId)
        .select(POSTS_SELECT_DETAIL)
        .maybeSingle()

      throwIfError(error, "Failed to update post")
      return (data as unknown as PostWithAuthorRow | null) ?? null
    },

    async deletePost(postId, authorId) {
      const { data, error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", authorId)
        .select("id")

      throwIfError(error, "Failed to delete post")
      return (data ?? []).length > 0
    },

    async listCommentsByPostId(postId: string, sort: CommentSort, limit = 300): Promise<CommentWithAuthorRow[]> {
      const normalizedLimit = Math.max(1, normalizePositiveInteger(limit, 300, 500))
      let query = supabase.from("comments").select(COMMENTS_SELECT).eq("post_id", postId)

      // Sort at DB level to ensure we get the right subset before limiting
      if (sort === "best") {
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      const { data, error } = await query.limit(normalizedLimit)

      throwIfError(error, "Failed to list comments")
      return (data ?? []) as unknown as CommentWithAuthorRow[]
    },

    async getCommentById(commentId: string): Promise<CommentWithAuthorRow | null> {
      const { data, error } = await supabase.from("comments").select(COMMENTS_SELECT).eq("id", commentId).maybeSingle()

      throwIfError(error, "Failed to load comment")
      return (data as unknown as CommentWithAuthorRow | null) ?? null
    },

    async createComment(payload) {
      const { data, error } = await supabase.from("comments").insert(payload).select(COMMENTS_SELECT).single()

      throwIfError(error, "Failed to create comment")
      return data as unknown as CommentWithAuthorRow
    },

    async updateComment(commentId, authorId, content) {
      const { data, error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", commentId)
        .eq("author_id", authorId)
        .select(COMMENTS_SELECT)
        .maybeSingle()

      throwIfError(error, "Failed to update comment")
      return (data as unknown as CommentWithAuthorRow | null) ?? null
    },

    async deleteComment(commentId, authorId) {
      const { data, error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("author_id", authorId)
        .select("id")

      throwIfError(error, "Failed to delete comment")
      return (data ?? []).length > 0
    },

    async targetExists(targetType: VoteTargetType, targetId: string): Promise<boolean> {
      const table = getTargetTable(targetType)
      const { data, error } = await supabase.from(table).select("id").eq("id", targetId).maybeSingle()

      throwIfError(error, "Failed to validate vote target")
      return Boolean(data)
    },

    async getVoteDirection(
      userId: string,
      targetType: VoteTargetType,
      targetId: string,
      isAnonymous: boolean,
    ): Promise<PersistedVoteDirection> {
      const { data, error } = await supabase
        .from("votes")
        .select("vote_direction")
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("is_anonymous", isAnonymous)
        .maybeSingle()

      throwIfError(error, "Failed to get vote")
      return (data?.vote_direction as unknown as PersistedVoteDirection | undefined) ?? 0
    },

    async insertVote(
      userId: string,
      targetType: VoteTargetType,
      targetId: string,
      direction: VoteDirection,
      isAnonymous: boolean,
    ) {
      const { error } = await supabase.from("votes").insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        vote_direction: direction,
        is_anonymous: isAnonymous,
      })

      throwIfError(error, "Failed to insert vote")
    },

    async updateVoteDirection(
      userId: string,
      targetType: VoteTargetType,
      targetId: string,
      direction: VoteDirection,
      isAnonymous: boolean,
    ) {
      const { error } = await supabase
        .from("votes")
        .update({ vote_direction: direction })
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("is_anonymous", isAnonymous)

      throwIfError(error, "Failed to update vote")
    },

    async deleteVote(userId: string, targetType: VoteTargetType, targetId: string, isAnonymous: boolean) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("is_anonymous", isAnonymous)

      throwIfError(error, "Failed to delete vote")
    },

    async getTargetVoteCount(targetType: VoteTargetType, targetId: string): Promise<number> {
      const table = getTargetTable(targetType)
      const { data, error } = await supabase.from(table).select("vote_count").eq("id", targetId).single()

      throwIfError(error, "Failed to load vote count")
      return (data as { vote_count: number }).vote_count
    },

    async listVotedPosts(
      userId: string,
      limit: number,
      offset: number,
    ): Promise<Array<PostWithAuthorRow & { vote_is_anonymous: boolean }>> {
      const normalizedLimit = Math.max(1, normalizePositiveInteger(limit, 50, 100))
      const normalizedOffset = normalizePositiveInteger(offset, 0, 10_000)

      // Step 1: get upvote records ordered by recency
      const { data: voteRows, error: voteError } = await supabase
        .from("votes")
        .select("target_id,is_anonymous")
        .eq("user_id", userId)
        .eq("target_type", "post")
        .gt("vote_direction", 0)
        .order("created_at", { ascending: false })
        .range(normalizedOffset, normalizedOffset + normalizedLimit - 1)

      throwIfError(voteError, "Failed to load voted posts")
      if (!voteRows || voteRows.length === 0) return []

      const typedVoteRows = voteRows as { target_id: string; is_anonymous: boolean }[]

      // Unique post IDs for SQL query (same post may have both anon and verified votes)
      const uniquePostIds = [...new Set(typedVoteRows.map((r) => r.target_id))]

      // Step 2: fetch posts for those IDs
      const { data: postRows, error: postsError } = await supabase
        .from("posts")
        .select(POSTS_SELECT_LIST)
        .in("id", uniquePostIds)

      throwIfError(postsError, "Failed to load voted post details")

      const postRowById = new Map<string, PostWithAuthorRow>(
        ((postRows ?? []) as unknown as PostWithAuthorRow[]).map((r) => [r.id, r]),
      )

      // One entry per vote record — posts voted in both modes appear twice with different vote_is_anonymous
      return typedVoteRows
        .map((voteRow) => {
          const postRow = postRowById.get(voteRow.target_id)
          if (!postRow) return null
          return { ...postRow, vote_is_anonymous: voteRow.is_anonymous }
        })
        .filter((r): r is PostWithAuthorRow & { vote_is_anonymous: boolean } => r !== null)
    },
  }
}
