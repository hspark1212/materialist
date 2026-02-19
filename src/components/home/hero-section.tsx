import Link from "next/link"

import { formatNumber } from "@/lib"
import { Button } from "@/components/ui/button"
import { CrystalLogo } from "@/components/brand/crystal-logo"

export type CommunityStats = {
  members: number
  posts: number
  comments: number
}

type HeroSectionProps = {
  stats: CommunityStats
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-card/80 p-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <CrystalLogo size="md" className="text-primary" />
        <h1 className="text-lg font-bold tracking-tight">Materialist</h1>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Materials Science × AI — an anonymous hybrid community.
      </p>

      <div className="mt-2.5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>🎭 Post anonymously. No judgment.</span>
        <span>✅ Verify with ORCID for credibility.</span>
      </div>

      <div className="mt-3 flex justify-center gap-5">
        <div>
          <p className="text-base font-semibold">{formatNumber(stats.members)}</p>
          <p className="text-xs text-muted-foreground">Members</p>
        </div>
        <div>
          <p className="text-base font-semibold">{formatNumber(stats.posts)}</p>
          <p className="text-xs text-muted-foreground">Posts</p>
        </div>
        <div>
          <p className="text-base font-semibold">{formatNumber(stats.comments)}</p>
          <p className="text-xs text-muted-foreground">Comments</p>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <Button size="sm" asChild>
          <Link href="/login">Join Community</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/create">Create Post</Link>
        </Button>
      </div>
    </section>
  )
}
