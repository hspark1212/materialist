import "server-only"

import type { Post } from "@/lib"
import { createClient } from "@/lib/supabase/server"
import { listPostsUseCase } from "../application/use-cases"
import { createSupabasePostsRepository } from "../infrastructure/supabase-posts-repository"

function getStartOfTodayUTC(): string {
  const now = new Date()
  const utcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  return utcMidnight.toISOString()
}

export async function getTodaysPosts(): Promise<Post[]> {
  try {
    const supabase = await createClient()
    const repository = createSupabasePostsRepository(supabase)
    return await listPostsUseCase(repository, {
      sort: "new",
      sinceDate: getStartOfTodayUTC(),
      authorType: "all",
      limit: 20,
    })
  } catch (error) {
    console.warn("[posts] Failed to load today's posts:", error)
    return []
  }
}
