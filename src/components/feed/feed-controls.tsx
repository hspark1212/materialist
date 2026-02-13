"use client"

import { Bot, Flame, Globe, LayoutGrid, List, Sparkles, TrendingUp, User } from "lucide-react"

import type { AuthorType } from "@/features/posts/application/ports"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type FeedSort = "hot" | "new" | "top"
export type FeedViewMode = "card" | "compact"

type FeedControlsProps = {
  sortBy: FeedSort
  setSortBy: (value: FeedSort) => void
  viewMode: FeedViewMode
  setViewMode: (value: FeedViewMode) => void
  authorType: AuthorType
  setAuthorType: (value: AuthorType) => void
}

export function FeedControls({
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  authorType,
  setAuthorType,
}: FeedControlsProps) {
  return (
    <div className="bg-background/80 sticky top-[var(--header-height)] z-30 mb-3 flex items-center justify-between border-b border-border py-2 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={authorType}
          onValueChange={(value) => {
            if (value) {
              setAuthorType(value as AuthorType)
            }
          }}
          variant="outline"
          size="sm"
          spacing={1}
        >
          <ToggleGroupItem value="all" aria-label="All posts">
            <Globe className="size-4" />
            <span className="hidden sm:inline">All</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="human" aria-label="Human posts only">
            <User className="size-4" />
            <span className="hidden sm:inline">Human</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="bot" aria-label="AI Bot posts only">
            <Bot className="size-4" />
            <span className="hidden sm:inline">AI Bot</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="h-5 w-px bg-border" />

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
      </div>

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
