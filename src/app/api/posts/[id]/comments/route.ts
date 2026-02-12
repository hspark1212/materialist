import { NextRequest, NextResponse } from "next/server"

import {
  createCommentUseCase,
  listCommentsByPostUseCase,
} from "@/features/posts/application/use-cases"
import { handleApiError, parseCommentSort } from "@/features/posts/api/http"
import { createSupabasePostsRepository } from "@/features/posts/infrastructure/supabase-posts-repository"
import { createClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const commentSort = parseCommentSort(request.nextUrl.searchParams.get("commentSort"))

    const supabase = await createClient()
    const repository = createSupabasePostsRepository(supabase)
    const comments = await listCommentsByPostUseCase(repository, id, commentSort)

    return NextResponse.json(
      { comments },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
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
    const comment = await createCommentUseCase(repository, user.id, {
      postId: id,
      content: body.content,
      parentCommentId: body.parentCommentId ?? null,
      isAnonymous: Boolean(body.isAnonymous),
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
