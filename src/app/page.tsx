import { Suspense } from "react"

import { HomePageClient } from "@/app/home-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

type HomePageProps = {
  searchParams?: AwaitablePageSearchParams
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await resolvePageSearchParams(searchParams)
  const initialFeed = await getInitialPostsFeed({ searchParams: resolvedSearchParams })

  return (
    <Suspense>
      <HomePageClient initialFeed={initialFeed} />
    </Suspense>
  )
}
