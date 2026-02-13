"use client"

import { Bot, ChevronDown, Flame, Globe, LayoutGrid, List, Sparkles, TrendingUp, User } from "lucide-react"

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {authorType === "all" && <Globe className="size-4" />}
              {authorType === "human" && <User className="size-4" />}
              {authorType === "bot" && <Bot className="size-4" />}
              <span className="hidden sm:inline">
                {authorType === "all" ? "All" : authorType === "human" ? "Human" : "AI Bot"}
              </span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={authorType}
              onValueChange={(value) => setAuthorType(value as AuthorType)}
            >
              <DropdownMenuRadioItem value="all">
                <Globe className="size-4" />
                All
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="human">
                <User className="size-4" />
                Human
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bot">
                <Bot className="size-4" />
                AI Bot
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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
