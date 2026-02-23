import type { SupabaseClient } from "@supabase/supabase-js"

import type { BotReplyRepository, CommentContext, PostContext } from "../application/ports"

const MAX_PARENT_CHAIN = 10

function throwIfError(error: { message: string; code?: string } | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

export function createBotReplyRepository(adminClient: SupabaseClient): BotReplyRepository {
  return {
    async getPostContext(postId: string): Promise<PostContext | null> {
      const { data, error } = await adminClient
        .from("posts")
        .select("title, content, section")
        .eq("id", postId)
        .single()

      if (error && error.code === "PGRST116") return null
      throwIfError(error, "Failed to get post context")

      return data as PostContext
    },

    async getCommentWithParentChain(
      commentId: string,
    ): Promise<{ comment: CommentContext; parentChain: CommentContext[] } | null> {
      // Fetch the target comment with author profile
      const { data: commentRow, error: commentError } = await adminClient
        .from("comments")
        .select("id, content, author_id, parent_comment_id, depth, is_anonymous, profiles(display_name, generated_display_name, is_anonymous)")
        .eq("id", commentId)
        .single()

      if (commentError && commentError.code === "PGRST116") return null
      throwIfError(commentError, "Failed to get comment")
      if (!commentRow) return null

      const comment = mapToCommentContext(commentRow)

      // Walk up parent chain (max 10 levels)
      const parentChain: CommentContext[] = []
      let currentParentId = commentRow.parent_comment_id as string | null

      while (currentParentId && parentChain.length < MAX_PARENT_CHAIN) {
        const { data: parentRow, error: parentError } = await adminClient
          .from("comments")
          .select("id, content, author_id, parent_comment_id, depth, is_anonymous, profiles(display_name, generated_display_name, is_anonymous)")
          .eq("id", currentParentId)
          .single()

        if (parentError || !parentRow) break

        parentChain.unshift(mapToCommentContext(parentRow))
        currentParentId = parentRow.parent_comment_id as string | null
      }

      return { comment, parentChain }
    },

    async getRecentBotReplyCount(
      userId: string,
      postId: string,
      botUserId: string,
      windowSeconds: number,
    ): Promise<number> {
      // Find the user's recent comments on this post that mention the bot
      const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

      const { data: userComments, error: userError } = await adminClient
        .from("comments")
        .select("id")
        .eq("author_id", userId)
        .eq("post_id", postId)
        .gte("created_at", windowStart)

      throwIfError(userError, "Failed to get user comments")

      if (!userComments || userComments.length === 0) return 0

      const userCommentIds = userComments.map((c) => c.id)

      // Count bot replies to those user comments
      const { count, error: countError } = await adminClient
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("author_id", botUserId)
        .eq("post_id", postId)
        .in("parent_comment_id", userCommentIds)
        .gte("created_at", windowStart)

      throwIfError(countError, "Failed to count bot replies")

      return count ?? 0
    },

    async createBotComment(payload: {
      content: string
      authorId: string
      postId: string
      parentCommentId: string
      depth: number
    }): Promise<{ id: string }> {
      const { data, error } = await adminClient
        .from("comments")
        .insert({
          content: payload.content,
          author_id: payload.authorId,
          post_id: payload.postId,
          parent_comment_id: payload.parentCommentId,
          depth: payload.depth,
          is_anonymous: false,
        })
        .select("id")
        .single()

      throwIfError(error, "Failed to create bot comment")

      if (!data) throw new Error("createBotComment: insert returned no data")
      return { id: data.id as string }
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToCommentContext(row: any): CommentContext {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  const isAnonymous = row.is_anonymous as boolean

  let authorName: string
  if (isAnonymous) {
    authorName = (profile?.generated_display_name as string) ?? "Anonymous"
  } else {
    authorName = (profile?.display_name as string) ?? "Anonymous"
  }

  return {
    id: row.id as string,
    content: row.content as string,
    authorId: row.author_id as string,
    authorName,
    parentCommentId: row.parent_comment_id as string | null,
    depth: row.depth as number,
  }
}
