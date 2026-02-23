import { NextRequest, NextResponse } from "next/server"

import { mapPostRowToPost } from "@/features/posts/domain/mappers"
import { handleApiError } from "@/features/posts/api/http"
import { createSupabasePostsRepository } from "@/features/posts/infrastructure/supabase-posts-repository"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const limit = Math.min(
      Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10) || 50),
      100,
    )
    const offset = Math.max(0, parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10) || 0)

    const repository = createSupabasePostsRepository(supabase)
    const rows = await repository.listVotedPosts(user.id, limit + 1, offset)

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows

    const posts = items.map((row) => ({
      ...mapPostRowToPost(row),
      userVoteAnonymous: (row.vote_is_anonymous ? 1 : 0) as -1 | 0 | 1,
      userVoteVerified: (row.vote_is_anonymous ? 0 : 1) as -1 | 0 | 1,
      voteIsAnonymous: row.vote_is_anonymous,
    }))

    return NextResponse.json(
      { posts, hasMore, nextOffset: hasMore ? offset + limit : null },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
