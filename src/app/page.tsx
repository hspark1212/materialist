import { Suspense } from "react"

import { HomePageClient } from "@/app/home-page-client"
import { createClient } from "@/lib/supabase/server"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"
import { getTodaysPosts } from "@/features/posts/server/get-todays-posts"

type HomePageProps = {
  searchParams?: AwaitablePageSearchParams
}

async function getCommunityStats() {
  try {
    const supabase = await createClient()
    const [members, posts, comments] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
    ])
    return {
      members: members.count ?? 0,
      posts: posts.count ?? 0,
      comments: comments.count ?? 0,
    }
  } catch {
    return { members: 0, posts: 0, comments: 0 }
  }
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await resolvePageSearchParams(searchParams)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [initialFeed, stats, todaysPosts] = await Promise.all([
    getInitialPostsFeed({ searchParams: resolvedSearchParams }),
    // Only fetch stats for anonymous visitors (hero section)
    user ? Promise.resolve(null) : getCommunityStats(),
    getTodaysPosts(),
  ])

  return (
    <Suspense>
      <HomePageClient initialFeed={initialFeed} stats={stats} todaysPosts={todaysPosts} />
    </Suspense>
  )
}
