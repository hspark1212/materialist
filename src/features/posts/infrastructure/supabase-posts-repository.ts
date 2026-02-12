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

const PROFILE_COLUMNS_MINIMAL = [
  "id",
  "username",
  "display_name",
  "generated_display_name",
  "avatar_url",
  "karma",
  "is_anonymous",
  "created_at",
  "orcid_id",
  "orcid_name",
  "orcid_verified_at",
].join(",")

const PROFILE_COLUMNS_FULL = [
  "id",
  "username",
  "display_name",
  "generated_display_name",
  "avatar_url",
  "email",
  "institution",
  "bio",
  "karma",
  "is_anonymous",
  "created_at",
  "updated_at",
  "position",
  "department",
  "country",
  "website_url",
  "research_interests",
  "orcid_id",
  "orcid_name",
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
  "created_at",
  "updated_at",
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
  "created_at",
  "updated_at",
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

const POSTS_SELECT_LIST = `${POST_COLUMNS_LIST},profiles(${PROFILE_COLUMNS_MINIMAL})`
const POSTS_SELECT_DETAIL = `${POST_COLUMNS_FULL},profiles(${PROFILE_COLUMNS_FULL})`
const COMMENTS_SELECT = `${COMMENT_COLUMNS},profiles(${PROFILE_COLUMNS_MINIMAL})`

type SearchPostIdRow = {
  post_id: string
  rank: number
  created_at: string
  vote_count: number
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
  max: number,
): number {
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

export function createSupabasePostsRepository(
  supabase: SupabaseClient,
): PostsRepository {
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
      p_sort: params.sort,
      p_limit: limit,
      p_offset: offset,
    })

    throwIfError(searchError, "Failed to search posts")

    const ids = ((searchRows ?? []) as SearchPostIdRow[]).map((row) => row.post_id)
    if (!ids.length) return []

    const { data, error } = await supabase.from("posts").select(POSTS_SELECT_LIST).in("id", ids)
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

      let query = supabase.from("posts").select(POSTS_SELECT_LIST)

      if (params.section) {
        query = query.eq("section", params.section)
      }

      if (params.authorId) {
        query = query.eq("author_id", params.authorId)
      }

      if (params.tag) {
        query = query.contains("tags", [params.tag])
      }

      if (params.sort === "new") {
        query = query.order("created_at", { ascending: false })
      } else {
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
      }

      const { data, error } = await query.range(offset, offset + limit - 1)
      throwIfError(error, "Failed to list posts")

      return (data ?? []) as unknown as PostWithAuthorRow[]
    },

    async getPostById(postId: string): Promise<PostWithAuthorRow | null> {
      const { data, error } = await supabase
        .from("posts")
        .select(POSTS_SELECT_DETAIL)
        .eq("id", postId)
        .maybeSingle()

      throwIfError(error, "Failed to load post")

      return (data as unknown as PostWithAuthorRow | null) ?? null
    },

    async createPost(payload) {
      const { data, error } = await supabase
        .from("posts")
        .insert(payload)
        .select(POSTS_SELECT_DETAIL)
        .single()

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
      let query = supabase
        .from("comments")
        .select(COMMENTS_SELECT)
        .eq("post_id", postId)

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
      const { data, error } = await supabase
        .from("comments")
        .select(COMMENTS_SELECT)
        .eq("id", commentId)
        .maybeSingle()

      throwIfError(error, "Failed to load comment")
      return (data as unknown as CommentWithAuthorRow | null) ?? null
    },

    async createComment(payload) {
      const { data, error } = await supabase
        .from("comments")
        .insert(payload)
        .select(COMMENTS_SELECT)
        .single()

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
      const { data, error } = await supabase
        .from(table)
        .select("id")
        .eq("id", targetId)
        .maybeSingle()

      throwIfError(error, "Failed to validate vote target")
      return Boolean(data)
    },

    async getVoteDirection(
      userId: string,
      targetType: VoteTargetType,
      targetId: string,
    ): Promise<PersistedVoteDirection> {
      const { data, error } = await supabase
        .from("votes")
        .select("vote_direction")
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .maybeSingle()

      throwIfError(error, "Failed to get vote")
      return (data?.vote_direction as unknown as PersistedVoteDirection | undefined) ?? 0
    },

    async insertVote(
      userId: string,
      targetType: VoteTargetType,
      targetId: string,
      direction: VoteDirection,
    ) {
      const { error } = await supabase
        .from("votes")
        .insert({
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
          vote_direction: direction,
        })

      throwIfError(error, "Failed to insert vote")
    },

    async updateVoteDirection(
      userId: string,
      targetType: VoteTargetType,
      targetId: string,
      direction: VoteDirection,
    ) {
      const { error } = await supabase
        .from("votes")
        .update({ vote_direction: direction })
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)

      throwIfError(error, "Failed to update vote")
    },

    async deleteVote(userId: string, targetType: VoteTargetType, targetId: string) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)

      throwIfError(error, "Failed to delete vote")
    },

    async getTargetVoteCount(targetType: VoteTargetType, targetId: string): Promise<number> {
      const table = getTargetTable(targetType)
      const { data, error } = await supabase
        .from(table)
        .select("vote_count")
        .eq("id", targetId)
        .single()

      throwIfError(error, "Failed to load vote count")
      return (data as { vote_count: number }).vote_count
    },
  }
}
