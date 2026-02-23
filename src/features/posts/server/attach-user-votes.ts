import "server-only"

import type { Post } from "@/lib"
import type { createClient } from "@/lib/supabase/server"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type DualVoteMaps = {
  anonMap: Map<string, -1 | 0 | 1>
  verifiedMap: Map<string, -1 | 0 | 1>
}

/** Fetch authenticated user's vote directions for given post IDs split by identity mode. Returns null if anonymous or on error. */
export async function getUserDualVoteMap(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<DualVoteMaps | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: votes } = await supabase
      .from("votes")
      .select("target_id,vote_direction,is_anonymous")
      .eq("user_id", user.id)
      .eq("target_type", "post")
      .in("target_id", postIds)

    const anonMap = new Map<string, -1 | 0 | 1>()
    const verifiedMap = new Map<string, -1 | 0 | 1>()

    if (votes && votes.length > 0) {
      for (const v of votes) {
        const map = v.is_anonymous ? anonMap : verifiedMap
        map.set(v.target_id, v.vote_direction as -1 | 0 | 1)
      }
    }

    return { anonMap, verifiedMap }
  } catch {
    // Graceful degradation
  }
  return null
}

/** Attach authenticated user's dual vote state to Post[]. Returns unmodified posts on failure. */
export async function attachUserVotes(supabase: SupabaseClient, posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts

  const maps = await getUserDualVoteMap(
    supabase,
    posts.map((p) => p.id),
  )
  if (!maps) return posts

  return posts.map((p) => ({
    ...p,
    userVoteAnonymous: (maps.anonMap.get(p.id) ?? 0) as -1 | 0 | 1,
    userVoteVerified: (maps.verifiedMap.get(p.id) ?? 0) as -1 | 0 | 1,
  }))
}
