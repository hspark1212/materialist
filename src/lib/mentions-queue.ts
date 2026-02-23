import type { SupabaseClient } from "@supabase/supabase-js"

import { extractBotMentions } from "@/lib/mentions"
import { BOT_PERSONAS, type BotPersona } from "@/lib/bots"

export type MentionRequestRow = {
  id: string
  status: string
  target_type: "post" | "comment"
  target_id: string
  post_id: string
  author_user_id: string
  bot_key: BotPersona
  prompt_context: Record<string, unknown>
  response_comment_id: string | null
  error: string | null
  attempt_count: number
  next_attempt_at: string
}

type EnqueueMentionInput = {
  targetType: "post" | "comment"
  targetId: string
  postId: string
  authorUserId: string
  content: string
  postTitle?: string
  parentCommentContent?: string
  authorUsername?: string
}

type EnqueueResult = {
  enqueued: BotPersona[]
  skipped: string[]
}

export async function enqueueMentionRequests(
  supabase: SupabaseClient,
  input: EnqueueMentionInput
): Promise<EnqueueResult> {
  const mentions = extractBotMentions(input.content)

  if (mentions.length === 0) {
    return { enqueued: [], skipped: [] }
  }

  const enqueued: BotPersona[] = []
  const skipped: string[] = []

  for (const mention of mentions) {
    const promptContext = {
      mentionContent: input.content,
      postTitle: input.postTitle,
      parentCommentContent: input.parentCommentContent,
      authorUsername: input.authorUsername,
    }

    const { error } = await supabase.from("mention_requests").insert({
      target_type: input.targetType,
      target_id: input.targetId,
      post_id: input.postId,
      author_user_id: input.authorUserId,
      bot_key: mention.botKey,
      prompt_context: promptContext,
    })

    if (error) {
      if (error.code === "23505") {
        skipped.push(mention.username)
      } else {
        console.error(`Failed to enqueue mention for ${mention.username}:`, error.message)
        skipped.push(mention.username)
      }
    } else {
      enqueued.push(mention.botKey)
    }
  }

  return { enqueued, skipped }
}

export async function getPendingMentionRequests(
  supabase: SupabaseClient,
  limit = 10
): Promise<MentionRequestRow[]> {
  const { data, error } = await supabase
    .from("mention_requests")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("Failed to fetch pending mention requests:", error.message)
    return []
  }

  return (data ?? []) as MentionRequestRow[]
}

export async function markRequestProcessing(
  supabase: SupabaseClient,
  requestId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("mention_requests")
    .update({ status: "processing" })
    .eq("id", requestId)
    .eq("status", "pending")

  return !error
}

export async function markRequestCompleted(
  supabase: SupabaseClient,
  requestId: string,
  responseCommentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("mention_requests")
    .update({
      status: "completed",
      response_comment_id: responseCommentId,
    })
    .eq("id", requestId)

  return !error
}

export async function markRequestFailed(
  supabase: SupabaseClient,
  requestId: string,
  errorMessage: string,
  maxAttempts = 3
): Promise<boolean> {
  const { data: current } = await supabase
    .from("mention_requests")
    .select("attempt_count")
    .eq("id", requestId)
    .single()

  const attemptCount = (current?.attempt_count ?? 0) + 1
  const isFinalFailure = attemptCount >= maxAttempts

  const nextAttemptAt = isFinalFailure
    ? new Date().toISOString()
    : new Date(Date.now() + Math.pow(2, attemptCount) * 60 * 1000).toISOString()

  const { error } = await supabase
    .from("mention_requests")
    .update({
      status: isFinalFailure ? "failed" : "pending",
      error: errorMessage,
      attempt_count: attemptCount,
      next_attempt_at: nextAttemptAt,
    })
    .eq("id", requestId)

  return !error
}

export function isBotUserId(userId: string): boolean {
  const botUserIds = Object.values(BOT_PERSONAS)
    .map((bot) => process.env[bot.envKey])
    .filter(Boolean)

  return botUserIds.includes(userId)
}
