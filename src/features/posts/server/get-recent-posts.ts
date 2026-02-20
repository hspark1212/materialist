import "server-only"

import { createClient } from "@/lib/supabase/server"
import { listPostsUseCase } from "../application/use-cases"
import { createSupabasePostsRepository } from "../infrastructure/supabase-posts-repository"
import { attachUserVotes } from "./attach-user-votes"

export type RecentPostsLabel = "today" | "recent"

export type RecentPostsResult = {
  posts: import("@/lib").Post[]
  label: RecentPostsLabel
}

function getStartOfTodayUTC(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

/** Previous weekday midnight UTC. Mon→Fri, Tue–Fri→yesterday, Sat→Fri, Sun→Fri. */
function getPreviousWeekdayMidnightUTC(): string {
  const now = new Date()
  const dow = now.getUTCDay() // 0=Sun, 6=Sat
  const daysBack = dow === 1 ? 3 : dow === 0 ? 2 : dow === 6 ? 1 : 1
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysBack)).toISOString()
}

export async function getRecentPosts(): Promise<RecentPostsResult> {
  try {
    const supabase = await createClient()
    const repository = createSupabasePostsRepository(supabase)

    // 1st try: today's posts
    const todayPosts = await listPostsUseCase(repository, {
      sort: "new",
      sinceDate: getStartOfTodayUTC(),
      authorType: "all",
      limit: 20,
    })

    if (todayPosts.length > 0) {
      return { posts: await attachUserVotes(supabase, todayPosts), label: "today" }
    }

    // 2nd try: expand to previous weekday (covers weekends + empty weekdays)
    const recentPosts = await listPostsUseCase(repository, {
      sort: "new",
      sinceDate: getPreviousWeekdayMidnightUTC(),
      authorType: "all",
      limit: 20,
    })

    if (recentPosts.length > 0) {
      return { posts: await attachUserVotes(supabase, recentPosts), label: "recent" }
    }

    return { posts: [], label: "today" }
  } catch (error) {
    console.warn("[posts] Failed to load recent posts:", error)
    return { posts: [], label: "today" }
  }
}
