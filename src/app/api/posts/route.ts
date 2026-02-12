import { NextRequest, NextResponse } from "next/server"

import {
  createPostUseCase,
  listPostsUseCase,
} from "@/features/posts/application/use-cases"
import {
  handleApiError,
  parsePostSort,
  parsePostsLimit,
  parsePostsOffset,
  parseSearchQuery,
  parseSection,
} from "@/features/posts/api/http"
import { createSupabasePostsRepository } from "@/features/posts/infrastructure/supabase-posts-repository"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const sort = parsePostSort(request.nextUrl.searchParams.get("sort"))
    const section = parseSection(request.nextUrl.searchParams.get("section"))
    const authorId = request.nextUrl.searchParams.get("authorId") ?? undefined
    const tag = request.nextUrl.searchParams.get("tag") ?? undefined
    const query = parseSearchQuery(request.nextUrl.searchParams.get("q"))
    const limit = parsePostsLimit(request.nextUrl.searchParams.get("limit"))
    const offset = parsePostsOffset(request.nextUrl.searchParams.get("offset"))

    const supabase = await createClient()
    const repository = createSupabasePostsRepository(supabase)
    // Fetch one extra to determine if there are more posts
    const posts = await listPostsUseCase(repository, { sort, section, authorId, tag, query, limit: limit + 1, offset })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts

    return NextResponse.json(
      {
        posts: items,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    )
  } catch (error) {
    return handleApiError(error)
  }
}

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

    const input = await request.json()

    const repository = createSupabasePostsRepository(supabase)
    const post = await createPostUseCase(repository, user.id, input)

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
