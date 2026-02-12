import type { SupabaseClient } from "@supabase/supabase-js"

import type { TopicsRepository } from "../application/ports"
import type { TrendingTopic } from "../domain/types"

export function createSupabaseTopicsRepository(
  supabase: SupabaseClient,
): TopicsRepository {
  return {
    async getTrendingTopics(limit: number, daysBack: number): Promise<TrendingTopic[]> {
      const { data, error } = await supabase.rpc("get_trending_topics", {
        p_limit: limit,
        p_days: daysBack,
      })

      if (error) {
        throw new Error(`Failed to fetch trending topics: ${error.message}`)
      }

      const rows = Array.isArray(data) ? data : []
      return rows
        .map((row) => ({
          tag: String((row as { tag?: unknown }).tag ?? ""),
          count: Number((row as { count?: unknown }).count ?? 0),
          voteScore: Number((row as { vote_score?: unknown }).vote_score ?? 0),
        }))
        .filter((topic) => topic.tag.length > 0)
    },
  }
}
