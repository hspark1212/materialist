import { Suspense } from "react"
import type { Metadata } from "next"

import { ShowcasePageClient } from "@/app/showcase/showcase-page-client"
import {
  getInitialPostsFeed,
  resolvePageSearchParams,
  type AwaitablePageSearchParams,
} from "@/features/posts/server/get-initial-posts-feed"

export const metadata: Metadata = {
  title: "Showcase",
  description: "Share your tools, datasets, models, and projects in materials science and AI.",
  alternates: { canonical: "/showcase" },
}

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
