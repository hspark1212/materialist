import { ApplicationError } from "@/lib/errors"
import { getBotForSection } from "@/lib/bots"
import type { Section } from "@/lib/types"

import { parseMentionBot } from "../domain/mention-parser"
import { buildSystemPrompt, buildUserPrompt } from "../domain/prompt-builder"
import type { AiClient, BotReplyRepository } from "./ports"

type CreateBotReplyInput = {
  postId: string
  commentId: string
  userId: string
}

const RATE_LIMIT_WINDOW_SECONDS = 60
const MAX_COMMENT_DEPTH = 6

export async function createBotReplyUseCase(
  repository: BotReplyRepository,
  aiClient: AiClient,
  input: CreateBotReplyInput,
): Promise<{ commentId: string }> {
  // Fetch post context first to determine section and bot
  const postContext = await repository.getPostContext(input.postId)
  if (!postContext) {
    throw new ApplicationError(404, "Post not found")
  }

  const validSections = new Set<string>(["papers", "forum", "showcase", "jobs"])
  if (!validSections.has(postContext.section)) {
    throw new ApplicationError(500, "Unknown section")
  }
  const section = postContext.section as Section
  const bot = getBotForSection(section)
  const botUserId = process.env[bot.envKey]
  if (!botUserId) {
    throw new ApplicationError(503, "Bot is not configured")
  }

  // Fetch comment with parent chain
  const commentData = await repository.getCommentWithParentChain(input.commentId)
  if (!commentData) {
    throw new ApplicationError(404, "Comment not found")
  }

  // Verify the caller owns this comment
  if (commentData.comment.authorId !== input.userId) {
    throw new ApplicationError(403, "You can only trigger bot replies on your own comments")
  }

  // Verify mention exists and matches the section's bot
  const mention = parseMentionBot(commentData.comment.content)
  if (!mention.found) {
    throw new ApplicationError(400, `Comment does not mention @${bot.username}`)
  }
  if (mention.username !== bot.username) {
    throw new ApplicationError(400, `Wrong bot for this section. Use @${bot.username}`)
  }

  // Check depth limit (bot reply goes one level deeper)
  const botReplyDepth = commentData.comment.depth + 1
  if (botReplyDepth > MAX_COMMENT_DEPTH) {
    throw new ApplicationError(400, "Maximum comment depth exceeded")
  }

  // Rate limit: 1 bot reply per user per post per 60 seconds
  const recentCount = await repository.getRecentBotReplyCount(
    input.userId,
    input.postId,
    botUserId,
    RATE_LIMIT_WINDOW_SECONDS,
  )
  if (recentCount > 0) {
    throw new ApplicationError(429, "Please wait before mentioning the bot again")
  }

  // Build prompts with section-specific persona
  const systemPrompt = buildSystemPrompt(section)
  const userPrompt = buildUserPrompt({
    post: postContext,
    mentionComment: {
      authorName: commentData.comment.authorName,
      content: commentData.comment.content,
    },
    parentChain: commentData.parentChain.map((c) => ({
      authorName: c.authorName,
      content: c.content,
    })),
  })

  // Generate AI reply
  const replyContent = await aiClient.generateReply(systemPrompt, userPrompt)

  // Insert bot comment as reply to the mentioning comment
  const result = await repository.createBotComment({
    content: replyContent,
    authorId: botUserId,
    postId: input.postId,
    parentCommentId: input.commentId,
    depth: botReplyDepth,
  })

  return { commentId: result.id }
}
