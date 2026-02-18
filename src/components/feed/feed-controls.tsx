"use client"

import { Bot, ChevronDown, Flame, LayoutGrid, List, Sparkles, TrendingUp, User } from "lucide-react"

import type { AuthorType } from "@/features/posts/application/ports"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
            if (value) setAuthorType(value as AuthorType)
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="human" aria-label="Human posts" className="gap-1.5">
            <User className="size-4" />
            <span className="hidden sm:inline text-xs">Human</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="bot" aria-label="AI Bot posts" className="gap-1.5">
            <Bot className="size-4" />
            <span className="hidden sm:inline text-xs">Bot</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {sortBy === "hot" && <Flame className="size-4" />}
              {sortBy === "new" && <Sparkles className="size-4" />}
              {sortBy === "top" && <TrendingUp className="size-4" />}
              <span className="hidden sm:inline">
                {sortBy === "hot" ? "Hot" : sortBy === "new" ? "New" : "Top"}
              </span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(value) => setSortBy(value as FeedSort)}
            >
              <DropdownMenuRadioItem value="hot">
                <Flame className="size-4" />
                Hot
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="new">
                <Sparkles className="size-4" />
                New
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="top">
                <TrendingUp className="size-4" />
                Top
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
