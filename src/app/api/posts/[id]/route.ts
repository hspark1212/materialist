import { NextRequest, NextResponse } from "next/server"

import type { Post } from "@/lib"
import { deletePostUseCase, getPostDetailUseCase, updatePostUseCase } from "@/features/posts/application/use-cases"
import { handleApiError, parseCommentSort } from "@/features/posts/api/http"
import { createSupabasePostsRepository } from "@/features/posts/infrastructure/supabase-posts-repository"
import { createClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

async function resolvePostUserVotes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postId: string,
): Promise<{ anonymous: -1 | 0 | 1; verified: -1 | 0 | 1 }> {
  const { data, error } = await supabase
    .from("votes")
    .select("vote_direction,is_anonymous")
    .eq("user_id", userId)
    .eq("target_type", "post")
    .eq("target_id", postId)

  if (error) {
    console.warn("[post-detail/api] Failed to load post vote state:", error.message)
    return { anonymous: 0, verified: 0 }
  }

  let anonymous: -1 | 0 | 1 = 0
  let verified: -1 | 0 | 1 = 0
  for (const row of data ?? []) {
    if (row.is_anonymous) anonymous = row.vote_direction as -1 | 0 | 1
    else verified = row.vote_direction as -1 | 0 | 1
  }
  return { anonymous, verified }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const commentSort = parseCommentSort(request.nextUrl.searchParams.get("commentSort"))

    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    const repository = createSupabasePostsRepository(supabase)
    const detail = await getPostDetailUseCase(repository, id, commentSort, authUser?.id)
    const userVotes = authUser
      ? await resolvePostUserVotes(supabase, authUser.id, id)
      : { anonymous: 0 as const, verified: 0 as const }
    const post: Post = {
      ...detail.post,
      userVoteAnonymous: userVotes.anonymous,
      userVoteVerified: userVotes.verified,
    }

    return NextResponse.json(
      { ...detail, post },
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
