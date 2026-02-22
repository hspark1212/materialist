import { Suspense } from "react"
import type { Metadata } from "next"

import { PapersPageClient } from "@/app/papers/papers-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

export const metadata: Metadata = {
  title: "Papers",
  description: "Paper discussions, source links, AI summaries, and citations for materials science research.",
  alternates: { canonical: "/papers" },
}

type PapersPageProps = {
  searchParams?: AwaitablePageSearchParams
}

export default async function PapersPage({ searchParams }: PapersPageProps) {
  const resolvedSearchParams = await resolvePageSearchParams(searchParams)
  const initialFeed = await getInitialPostsFeed({
    section: "papers",
    searchParams: resolvedSearchParams,
  })

  return (
    <Suspense>
      <PapersPageClient initialFeed={initialFeed} />
    </Suspense>
  )
}
