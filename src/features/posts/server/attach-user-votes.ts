import "server-only"

import type { Post } from "@/lib"
import type { createClient } from "@/lib/supabase/server"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/** Fetch authenticated user's vote directions for given post IDs. Returns null if anonymous or on error. */
export async function getUserVoteMap(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<Map<string, -1 | 0 | 1> | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: votes } = await supabase
      .from("votes")
      .select("target_id,vote_direction")
      .eq("user_id", user.id)
      .eq("target_type", "post")
      .in("target_id", postIds)

    if (votes && votes.length > 0) {
      return new Map(votes.map((v) => [v.target_id, v.vote_direction as -1 | 0 | 1]))
    }
  } catch {
    // Graceful degradation
  }
  return null
}

/** Attach authenticated user's vote state to Post[]. Returns unmodified posts on failure. */
export async function attachUserVotes(supabase: SupabaseClient, posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts

  const voteMap = await getUserVoteMap(
    supabase,
    posts.map((p) => p.id),
  )
  if (!voteMap) return posts

  return posts.map((p) => ({
    ...p,
    userVote: (voteMap.get(p.id) ?? 0) as -1 | 0 | 1,
  }))
}
