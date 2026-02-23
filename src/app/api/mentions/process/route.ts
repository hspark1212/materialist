import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { generateBotReply } from "@/lib/gemini/client"
import { BOT_PERSONAS, getBotUserId } from "@/lib/bots"
import {
  getPendingMentionRequests,
  markRequestProcessing,
  markRequestCompleted,
  markRequestFailed,
  type MentionRequestRow,
} from "@/lib/mentions-queue"
import { handleApiError } from "@/features/posts/api/http"

const MAX_ATTEMPTS = 3
const BATCH_SIZE = 5

function validateAuth(request: NextRequest): boolean {
  const processorSecret = process.env.MENTIONS_PROCESSOR_SECRET
  if (!processorSecret) {
    return false
  }

  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false
  }

  const token = authHeader.slice(7)
  return token === processorSecret
}

async function processMentionRequest(
  adminClient: ReturnType<typeof createAdminClient>,
  request: MentionRequestRow
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  const botConfig = BOT_PERSONAS[request.bot_key]
  if (!botConfig) {
    return { success: false, error: `Unknown bot persona: ${request.bot_key}` }
  }

  const botUserId = getBotUserId(request.bot_key)
  if (!botUserId) {
    return { success: false, error: `Bot user ID not configured for ${request.bot_key}` }
  }

  try {
    const promptContext = request.prompt_context as {
      mentionContent: string
      postTitle?: string
      parentCommentContent?: string
      authorUsername?: string
    }

    const response = await generateBotReply({
      botKey: request.bot_key,
      promptContext: {
        targetType: request.target_type,
        targetId: request.target_id,
        postId: request.post_id,
        mentionContent: promptContext.mentionContent,
        postTitle: promptContext.postTitle,
        parentCommentContent: promptContext.parentCommentContent,
        authorUsername: promptContext.authorUsername,
      },
    })

    const parentCommentId =
      request.target_type === "comment" ? request.target_id : null

    const { data: comment, error: insertError } = await adminClient
      .from("comments")
      .insert({
        content: response.text,
        author_id: botUserId,
        post_id: request.post_id,
        parent_comment_id: parentCommentId,
        depth: parentCommentId ? 1 : 0,
        is_anonymous: false,
      })
      .select("id")
      .single()

    if (insertError) {
      return { success: false, error: `Failed to create comment: ${insertError.message}` }
    }

    return { success: true, commentId: comment.id }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

export async function POST(request: NextRequest) {
  try {
    const processorSecret = process.env.MENTIONS_PROCESSOR_SECRET
    if (!processorSecret) {
      console.error("MENTIONS_PROCESSOR_SECRET not configured")
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    if (!validateAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const pendingRequests = await getPendingMentionRequests(adminClient, BATCH_SIZE)

    if (pendingRequests.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending requests" })
    }

    let processed = 0
    let succeeded = 0
    let failed = 0

    for (const req of pendingRequests) {
      const locked = await markRequestProcessing(adminClient, req.id)
      if (!locked) {
        continue
      }

      processed++

      const result = await processMentionRequest(adminClient, req)

      if (result.success && result.commentId) {
        await markRequestCompleted(adminClient, req.id, result.commentId)
        succeeded++
      } else {
        await markRequestFailed(adminClient, req.id, result.error ?? "Unknown error", MAX_ATTEMPTS)
        failed++
      }
    }

    return NextResponse.json({
      processed,
      succeeded,
      failed,
      remaining: Math.max(0, pendingRequests.length - processed),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
