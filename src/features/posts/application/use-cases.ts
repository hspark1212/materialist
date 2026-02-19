import type { Comment, Post } from "@/lib"

import { buildCommentTree } from "../domain/comment-tree"
import {
  mapCommentRowToComment,
  mapCommentTreeToComments,
  mapPostRowToPost,
} from "../domain/mappers"
import { buildCreatePostInsert, buildUpdatePostPatch } from "../domain/post-payload"
import { resolveVoteMutation } from "../domain/vote-state"
import type {
  CastVoteInput,
  CommentSort,
  CreateCommentInput,
  CreatePostInput,
  UpdateCommentInput,
  UpdatePostInput,
} from "../domain/types"
import { ApplicationError } from "./errors"
import type { ListPostsParams, PostsRepository } from "./ports"

export async function listPostsUseCase(
  repository: PostsRepository,
  params: ListPostsParams,
): Promise<Post[]> {
  const rows = await repository.listPosts(params)
  return rows.map(mapPostRowToPost)
}

export async function getPostDetailUseCase(
  repository: PostsRepository,
  postId: string,
  commentSort: CommentSort,
  authenticatedUserId?: string,
): Promise<{ post: Post; comments: Comment[] }> {
  const postRow = await repository.getPostById(postId)
  if (!postRow) {
    throw new ApplicationError(404, "Post not found")
  }

  const commentRows = await repository.listCommentsByPostId(postId, commentSort, 300)
  const commentTree = buildCommentTree(commentRows, commentSort)

  const post = mapPostRowToPost(postRow)
  const comments = mapCommentTreeToComments(commentTree)

  if (authenticatedUserId) {
    post.isOwner = postRow.author_id === authenticatedUserId
    const authorMap = new Map(commentRows.map((r) => [r.id, r.author_id]))
    setCommentOwnership(comments, authorMap, authenticatedUserId)
  }

  return { post, comments }
}

function setCommentOwnership(
  comments: Comment[],
  authorMap: Map<string, string>,
  userId: string,
) {
  for (const comment of comments) {
    comment.isOwner = authorMap.get(comment.id) === userId
    setCommentOwnership(comment.replies, authorMap, userId)
  }
}

export async function createPostUseCase(
  repository: PostsRepository,
  userId: string,
  input: CreatePostInput,
): Promise<Post> {
  const payload = buildCreatePostInsert(userId, input)
  const row = await repository.createPost(payload)
  return mapPostRowToPost(row)
}

export async function updatePostUseCase(
  repository: PostsRepository,
  userId: string,
  postId: string,
  input: UpdatePostInput,
): Promise<Post> {
  const current = await repository.getPostById(postId)

  if (!current) {
    throw new ApplicationError(404, "Post not found")
  }

  if (current.author_id !== userId) {
    throw new ApplicationError(403, "You can only edit your own posts")
  }

  const payload = buildUpdatePostPatch(current.section, current.url, input)
  const updated = await repository.updatePost(postId, userId, payload)

  if (!updated) {
    throw new ApplicationError(404, "Post not found")
  }

  return mapPostRowToPost(updated)
}

export async function deletePostUseCase(
  repository: PostsRepository,
  userId: string,
  postId: string,
): Promise<void> {
  const current = await repository.getPostById(postId)

  if (!current) {
    throw new ApplicationError(404, "Post not found")
  }

  if (current.author_id !== userId) {
    throw new ApplicationError(403, "You can only delete your own posts")
  }

  const deleted = await repository.deletePost(postId, userId)
  if (!deleted) {
    throw new ApplicationError(404, "Post not found")
  }
}

export async function listCommentsByPostUseCase(
  repository: PostsRepository,
  postId: string,
  commentSort: CommentSort,
): Promise<Comment[]> {
  const commentRows = await repository.listCommentsByPostId(postId, commentSort, 300)
  const commentTree = buildCommentTree(commentRows, commentSort)
  return mapCommentTreeToComments(commentTree)
}

export async function createCommentUseCase(
  repository: PostsRepository,
  userId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  const content = input.content.trim()
  if (!content) {
    throw new ApplicationError(400, "Comment content is required")
  }

  const parentCommentId = input.parentCommentId ?? null
  let depth = 0

  if (parentCommentId) {
    const parent = await repository.getCommentById(parentCommentId)

    if (!parent) {
      throw new ApplicationError(404, "Parent comment not found")
    }

    if (parent.post_id !== input.postId) {
      throw new ApplicationError(400, "Parent comment does not belong to this post")
    }

    depth = parent.depth + 1
    if (depth > 6) {
      throw new ApplicationError(400, "Maximum comment depth exceeded")
    }
  }

  const row = await repository.createComment({
    content,
    author_id: userId,
    post_id: input.postId,
    parent_comment_id: parentCommentId,
    depth,
    is_anonymous: input.isAnonymous,
  })

  return mapCommentRowToComment(row)
}

export async function updateCommentUseCase(
  repository: PostsRepository,
  userId: string,
  commentId: string,
  input: UpdateCommentInput,
): Promise<Comment> {
  const existing = await repository.getCommentById(commentId)

  if (!existing) {
    throw new ApplicationError(404, "Comment not found")
  }

  if (existing.author_id !== userId) {
    throw new ApplicationError(403, "You can only edit your own comments")
  }

  const content = input.content.trim()
  if (!content) {
    throw new ApplicationError(400, "Comment content is required")
  }

  const updated = await repository.updateComment(commentId, userId, content)

  if (!updated) {
    throw new ApplicationError(404, "Comment not found")
  }

  return mapCommentRowToComment(updated)
}

export async function deleteCommentUseCase(
  repository: PostsRepository,
  userId: string,
  commentId: string,
): Promise<void> {
  const existing = await repository.getCommentById(commentId)

  if (!existing) {
    throw new ApplicationError(404, "Comment not found")
  }

  if (existing.author_id !== userId) {
    throw new ApplicationError(403, "You can only delete your own comments")
  }

  const deleted = await repository.deleteComment(commentId, userId)
  if (!deleted) {
    throw new ApplicationError(404, "Comment not found")
  }
}

export async function castVoteUseCase(
  repository: PostsRepository,
  userId: string,
  input: CastVoteInput,
): Promise<{ userVote: -1 | 0 | 1; voteCount: number }> {
  const targetExists = await repository.targetExists(input.targetType, input.targetId)

  if (!targetExists) {
    throw new ApplicationError(404, "Vote target not found")
  }

  const existingDirection = await repository.getVoteDirection(userId, input.targetType, input.targetId)
  const mutation = resolveVoteMutation(existingDirection, input.direction)

  if (mutation.action === "insert") {
    await repository.insertVote(userId, input.targetType, input.targetId, input.direction)
  } else if (mutation.action === "update") {
    await repository.updateVoteDirection(userId, input.targetType, input.targetId, input.direction)
  } else {
    await repository.deleteVote(userId, input.targetType, input.targetId)
  }

  const voteCount = await repository.getTargetVoteCount(input.targetType, input.targetId)

  return {
    userVote: mutation.nextDirection,
    voteCount,
  }
}
