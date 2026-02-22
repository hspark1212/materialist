import { Suspense } from "react"
import type { Metadata } from "next"

import { JobsPageClient } from "@/app/jobs/jobs-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

export const metadata: Metadata = {
  title: "Jobs",
  description: "Job postings — postdoc, PhD, industry, and internship opportunities in materials science and AI.",
  alternates: { canonical: "/jobs" },
}

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
