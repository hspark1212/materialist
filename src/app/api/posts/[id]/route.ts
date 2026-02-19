import { NextRequest, NextResponse } from "next/server"

import type { Post } from "@/lib"
import {
  deletePostUseCase,
  getPostDetailUseCase,
  updatePostUseCase,
} from "@/features/posts/application/use-cases"
import { handleApiError, parseCommentSort } from "@/features/posts/api/http"
import { createSupabasePostsRepository } from "@/features/posts/infrastructure/supabase-posts-repository"
import { createClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

async function resolvePostUserVote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postId: string,
): Promise<-1 | 0 | 1> {
  const { data, error } = await supabase
    .from("votes")
    .select("vote_direction")
    .eq("user_id", userId)
    .eq("target_type", "post")
    .eq("target_id", postId)
    .maybeSingle()

  if (error) {
    console.warn("[post-detail/api] Failed to load post vote state:", error.message)
    return 0
  }

  return (data?.vote_direction as -1 | 0 | 1 | undefined) ?? 0
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const commentSort = parseCommentSort(request.nextUrl.searchParams.get("commentSort"))

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    const repository = createSupabasePostsRepository(supabase)
    const detail = await getPostDetailUseCase(repository, id, commentSort, authUser?.id)
    const userVote = authUser ? await resolvePostUserVote(supabase, authUser.id, id) : 0
    const post: Post = { ...detail.post, userVote }

    return NextResponse.json({ ...detail, post }, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
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

    const input = await request.json()
    const repository = createSupabasePostsRepository(supabase)
    const post = await updatePostUseCase(repository, user.id, id, input)

    return NextResponse.json({ post })
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
    await deletePostUseCase(repository, user.id, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
