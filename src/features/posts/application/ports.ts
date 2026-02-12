import type { Section } from "@/lib"

import type {
  CommentInsertPayload,
  CommentSort,
  CommentWithAuthorRow,
  PostInsertPayload,
  PostSort,
  PostUpdatePayload,
  PostWithAuthorRow,
  VoteDirection,
  VoteTargetType,
  PersistedVoteDirection,
} from "../domain/types"

export type ListPostsParams = {
  section?: Section
  authorId?: string
  tag?: string
  query?: string
  sort: PostSort
  limit?: number
  offset?: number
}

export interface PostsRepository {
  listPosts(params: ListPostsParams): Promise<PostWithAuthorRow[]>
  getPostById(postId: string): Promise<PostWithAuthorRow | null>
  createPost(payload: PostInsertPayload): Promise<PostWithAuthorRow>
  updatePost(postId: string, authorId: string, payload: PostUpdatePayload): Promise<PostWithAuthorRow | null>
  deletePost(postId: string, authorId: string): Promise<boolean>

  listCommentsByPostId(postId: string, sort: CommentSort, limit?: number): Promise<CommentWithAuthorRow[]>
  getCommentById(commentId: string): Promise<CommentWithAuthorRow | null>
  createComment(payload: CommentInsertPayload): Promise<CommentWithAuthorRow>
  updateComment(commentId: string, authorId: string, content: string): Promise<CommentWithAuthorRow | null>
  deleteComment(commentId: string, authorId: string): Promise<boolean>

  targetExists(targetType: VoteTargetType, targetId: string): Promise<boolean>
  getVoteDirection(userId: string, targetType: VoteTargetType, targetId: string): Promise<PersistedVoteDirection>
  insertVote(userId: string, targetType: VoteTargetType, targetId: string, direction: VoteDirection): Promise<void>
  updateVoteDirection(userId: string, targetType: VoteTargetType, targetId: string, direction: VoteDirection): Promise<void>
  deleteVote(userId: string, targetType: VoteTargetType, targetId: string): Promise<void>
  getTargetVoteCount(targetType: VoteTargetType, targetId: string): Promise<number>
}
