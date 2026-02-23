import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getUserDualVoteMap } from "@/features/posts/server/attach-user-votes"

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

export function calculateTrendingScore(voteCount: number, commentCount: number, createdAt: string): number {
  const hoursAge = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  return (voteCount + commentCount * 0.5) / Math.pow(hoursAge + 2, 1.5)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parsePositiveInt(searchParams.get("limit"), 3, 50)
    const daysBack = parsePositiveInt(searchParams.get("days"), 30, 365)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    const candidatePoolSize = Math.max(limit * 10, 50)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, section, vote_count, comment_count, content, created_at")
      .gte("created_at", cutoffDate.toISOString())
      .order("vote_count", { ascending: false })
      .limit(candidatePoolSize)

    if (error) {
      throw new Error(error.message)
    }

    const candidates = data ?? []
    const ranked = candidates
      .map((p) => ({ ...p, _score: calculateTrendingScore(p.vote_count, p.comment_count, p.created_at) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)

    const posts = ranked.map(({ id, title, section, vote_count, comment_count, content }) => ({
      id,
      title,
      section,
      vote_count,
      comment_count,
      content,
    }))

    const dualVoteMap = posts.length > 0 ? await getUserDualVoteMap(supabase, posts.map((p) => p.id)) : null
    const postsWithVotes = posts.map((p) => ({
      ...p,
      user_vote_anonymous: (dualVoteMap?.anonMap.get(p.id) ?? 0) as -1 | 0 | 1,
      user_vote_verified: (dualVoteMap?.verifiedMap.get(p.id) ?? 0) as -1 | 0 | 1,
    }))

    return NextResponse.json({ posts: postsWithVotes })
  } catch (error) {
    console.error("[API] Failed to fetch trending posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
