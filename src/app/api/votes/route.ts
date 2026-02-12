import { NextRequest, NextResponse } from "next/server"

import { castVoteUseCase } from "@/features/posts/application/use-cases"
import {
  handleApiError,
  parseVoteDirection,
  parseVoteTargetType,
} from "@/features/posts/api/http"
import { createSupabasePostsRepository } from "@/features/posts/infrastructure/supabase-posts-repository"
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
    const targetType = parseVoteTargetType(body.targetType)
    const direction = parseVoteDirection(body.direction)

    const repository = createSupabasePostsRepository(supabase)
    const result = await castVoteUseCase(repository, user.id, {
      targetType,
      targetId: body.targetId,
      direction,
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
