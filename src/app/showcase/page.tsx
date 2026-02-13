import { Suspense } from "react"

import { ShowcasePageClient } from "@/app/showcase/showcase-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

type ShowcasePageProps = {
  searchParams?: AwaitablePageSearchParams
}

export default async function ShowcasePage({ searchParams }: ShowcasePageProps) {
  const resolvedSearchParams = await resolvePageSearchParams(searchParams)
  const initialFeed = await getInitialPostsFeed({
    section: "showcase",
    searchParams: resolvedSearchParams,
  })

  return (
    <Suspense>
      <ShowcasePageClient initialFeed={initialFeed} />
    </Suspense>
  )
}
