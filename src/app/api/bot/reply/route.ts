import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/api-error"
import { createBotReplyUseCase } from "@/features/bot-mention/application/use-cases"
import { createGeminiClient } from "@/features/bot-mention/infrastructure/gemini-client"
import { createBotReplyRepository } from "@/features/bot-mention/infrastructure/supabase-bot-reply-repository"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { postId, commentId } = body as { postId?: string; commentId?: string }

    if (!postId || !commentId || typeof postId !== "string" || typeof commentId !== "string") {
      return NextResponse.json({ error: "postId and commentId are required" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const repository = createBotReplyRepository(adminClient)
    const aiClient = createGeminiClient()

    const result = await createBotReplyUseCase(repository, aiClient, {
      postId,
      commentId,
      userId: user.id,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
