"use client"

import { Bot, ChevronDown, Flame, Sparkles, TrendingUp, User } from "lucide-react"

import type { AuthorType } from "@/features/posts/application/ports"
import { cn } from "@/lib"
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
export type DiscoveryChip = "today" | "trending"

type FeedControlsProps = {
  sortBy: FeedSort
  setSortBy: (value: FeedSort) => void
  authorType: AuthorType
  setAuthorType: (value: AuthorType) => void
}

export function FeedControls({ sortBy, setSortBy, authorType, setAuthorType }: FeedControlsProps) {
  return (
    <div className="bg-background/80 border-border sticky top-[var(--header-height)] z-30 mb-3 flex items-center justify-between border-b py-2 backdrop-blur-sm">
      <ToggleGroup
        type="single"
        value={authorType}
        onValueChange={(value) => {
          setAuthorType((value || "all") as AuthorType)
        }}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem
          value="human"
          aria-label="Human posts"
          className={cn(
            "relative gap-1 overflow-hidden px-2 text-[11px]",
            authorType === "human"
              ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
              : "animate-shimmer",
          )}
        >
          <User className="size-3.5" />
          <span>Human</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="bot"
          aria-label="AI Bot posts"
          className={cn(
            "relative gap-1 overflow-hidden px-2 text-[11px]",
            authorType === "bot"
              ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
              : "animate-shimmer",
          )}
        >
          <Bot className="size-3.5" />
          <span className="max-[360px]:hidden">AI Bot</span>
          <span className="hidden max-[360px]:inline">Bot</span>
        </ToggleGroupItem>
      </ToggleGroup>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 px-2 text-[11px]">
            {sortBy === "hot" && <Flame className="size-3.5" />}
            {sortBy === "new" && <Sparkles className="size-3.5" />}
            {sortBy === "top" && <TrendingUp className="size-3.5" />}
            <span>{sortBy === "hot" ? "Hot" : sortBy === "new" ? "New" : "Top"}</span>
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as FeedSort)}>
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
  )
}
