"use client"

import { sectionByKey } from "@/lib/sections"
import { Card, CardContent } from "@/components/ui/card"
import type { PostsFeedInitialData } from "@/features/posts/domain/feed-initial-data"
import { FeedPageClient } from "@/features/posts/presentation/feed-page-client"

const meta = sectionByKey.papers

type PapersPageClientProps = {
  initialFeed: PostsFeedInitialData
}

export function PapersPageClient({ initialFeed }: PapersPageClientProps) {
  return (
    <FeedPageClient
      section="papers"
      initialFeed={initialFeed}
      header={
        <Card className="overflow-hidden border-[var(--section-papers)]/20 py-0">
          <CardContent
            className="px-4 py-5 sm:px-6"
            style={{
              backgroundImage:
                "linear-gradient(120deg, color-mix(in srgb, var(--section-papers) 20%, transparent) 0%, transparent 68%)",
            }}
          >
            <div className="flex items-center gap-3">
              <meta.icon className="size-8 text-[var(--section-papers)]" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{meta.label}</h1>
                <p className="text-muted-foreground text-sm">{meta.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    />
  )
}
