import { NextRequest, NextResponse } from "next/server"

import { deleteCommentUseCase, updateCommentUseCase } from "@/features/posts/application/use-cases"
import { handleApiError } from "@/features/posts/api/http"
import { createSupabasePostsRepository } from "@/features/posts/infrastructure/supabase-posts-repository"
import { createClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const repository = createSupabasePostsRepository(supabase)
    const comment = await updateCommentUseCase(repository, user.id, id, {
      content: body.content,
    })

    return NextResponse.json({ comment })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const repository = createSupabasePostsRepository(supabase)
    await deleteCommentUseCase(repository, user.id, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
