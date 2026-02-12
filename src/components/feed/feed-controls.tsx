"use client"

import { Flame, LayoutGrid, List, Sparkles, TrendingUp } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type FeedSort = "hot" | "new" | "top"
export type FeedViewMode = "card" | "compact"

type FeedControlsProps = {
  sortBy: FeedSort
  setSortBy: (value: FeedSort) => void
  viewMode: FeedViewMode
  setViewMode: (value: FeedViewMode) => void
}

export function FeedControls({
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
}: FeedControlsProps) {
  return (
    <div className="bg-background/80 sticky top-[var(--header-height)] z-30 mb-3 flex items-center justify-between border-b border-border py-2 backdrop-blur-sm">
      <ToggleGroup
        type="single"
        value={sortBy}
        onValueChange={(value) => {
          if (value) {
            setSortBy(value as FeedSort)
          }
        }}
        variant="outline"
        size="sm"
        spacing={1}
      >
        <ToggleGroupItem value="hot" aria-label="Sort by hot">
          <Flame className="size-4" />
          <span className="hidden sm:inline">Hot</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="new" aria-label="Sort by new">
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">New</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="top" aria-label="Sort by top">
          <TrendingUp className="size-4" />
          <span className="hidden sm:inline">Top</span>
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value) => {
          if (value) {
            setViewMode(value as FeedViewMode)
          }
        }}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="card" aria-label="Card view">
          <LayoutGrid className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="compact" aria-label="Compact view">
          <List className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
