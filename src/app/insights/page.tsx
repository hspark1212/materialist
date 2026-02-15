import { Suspense } from "react"

import { RightSidebar } from "@/components/layout/right-sidebar"
import { RightSidebarSkeleton } from "@/components/layout/right-sidebar-skeleton"

export default async function InsightsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Suspense fallback={<RightSidebarSkeleton sticky={false} />}>
        <RightSidebar sticky={false} />
      </Suspense>
    </div>
  )
}
