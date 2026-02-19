"use client"

import { Badge } from "@/components/ui/badge"

type ActiveTagBadgeProps = {
  tag: string
  onClear: () => void
}

export function ActiveTagBadge({ tag, onClear }: ActiveTagBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className="font-mono text-xs">
        #{tag}
      </Badge>
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground text-xs">
        ✕ Clear filter
      </button>
    </div>
  )
}
