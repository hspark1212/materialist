"use client"

import { Badge } from "@/components/ui/badge"

type ActiveSearchBadgeProps = {
  query: string
  onClear: () => void
}

export function ActiveSearchBadge({ query, onClear }: ActiveSearchBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        Search: {query}
      </Badge>
      <button type="button" onClick={onClear} className="text-muted-foreground text-xs hover:text-foreground">
        x Clear search
      </button>
    </div>
  )
}
