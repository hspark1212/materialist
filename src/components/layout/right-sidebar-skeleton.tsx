import { cn } from "@/lib"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="relative gap-3 overflow-hidden py-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-muted to-muted-foreground/20"
      />
      <CardHeader className="px-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-2 h-3 w-36" />
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  )
}

type RightSidebarSkeletonProps = {
  sticky?: boolean
  className?: string
}

export function RightSidebarSkeleton({ sticky = true, className }: RightSidebarSkeletonProps = {}) {
  return (
    <aside
      className={cn(
        "space-y-3 py-4",
        sticky ? "sticky top-[var(--header-height)]" : "",
        className,
      )}
    >
      {/* About Materialist - Stats grid */}
      <Card className="relative gap-3 overflow-hidden py-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-muted to-muted-foreground/20"
        />
        <CardHeader className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-2 h-3 w-44" />
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 px-4">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </CardContent>
      </Card>

      {/* Community Philosophy */}
      <SkeletonCard rows={2} />

      {/* Top Materialists */}
      <SkeletonCard rows={5} />

      {/* Developers */}
      <SkeletonCard rows={3} />
    </aside>
  )
}
