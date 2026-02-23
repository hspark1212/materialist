export type PostContext = {
  title: string
  content: string
  section: string
}

export type CommentContext = {
  id: string
  content: string
  authorId: string
  authorName: string
  parentCommentId: string | null
  depth: number
}

export interface BotReplyRepository {
  getPostContext(postId: string): Promise<PostContext | null>
  getCommentWithParentChain(commentId: string): Promise<{
    comment: CommentContext
    parentChain: CommentContext[]
  } | null>
  getRecentBotReplyCount(userId: string, postId: string, botUserId: string, windowSeconds: number): Promise<number>
  createBotComment(payload: {
    content: string
    authorId: string
    postId: string
    parentCommentId: string
    depth: number
  }): Promise<{ id: string }>
}

export interface AiClient {
  generateReply(systemPrompt: string, userPrompt: string): Promise<string>
}
