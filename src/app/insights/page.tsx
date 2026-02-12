import { Suspense } from "react"
import { BarChart3 } from "lucide-react"

import { RightSidebar } from "@/components/layout/right-sidebar"
import { RightSidebarSkeleton } from "@/components/layout/right-sidebar-skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { isMobileRequest } from "@/lib/request/is-mobile-request"

export default async function InsightsPage() {
  const showMobileInsights = await isMobileRequest()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Card className="overflow-hidden border-primary/20 py-0">
        <CardContent
          className="px-4 py-5 sm:px-6"
          style={{
            backgroundImage:
              "linear-gradient(120deg, color-mix(in srgb, var(--section-showcase) 18%, transparent) 0%, transparent 68%)",
          }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="size-8 text-[var(--section-showcase)]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
              <p className="text-muted-foreground text-sm">Community stats, leaders, and project updates.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<RightSidebarSkeleton sticky={false} />}>
        {/* Render the full insights panel only on mobile; desktop already has the right sidebar. */}
        {showMobileInsights ? <RightSidebar sticky={false} /> : null}
      </Suspense>
    </div>
  )
}
