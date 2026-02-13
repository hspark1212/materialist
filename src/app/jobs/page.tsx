import { Suspense } from "react"

import { JobsPageClient } from "@/app/jobs/jobs-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

type JobsPageProps = {
  searchParams?: AwaitablePageSearchParams
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedSearchParams = await resolvePageSearchParams(searchParams)
  const initialFeed = await getInitialPostsFeed({
    section: "jobs",
    searchParams: resolvedSearchParams,
  })

  return (
    <Suspense>
      <JobsPageClient initialFeed={initialFeed} />
    </Suspense>
  )
}
