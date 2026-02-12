"use client"

import { type FormEvent, useRef, useState } from "react"
import { Clock, Search, TrendingUp, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSearchFilter } from "@/features/posts/presentation/use-search-filter"

const recentSearches = [
  "machine learning force fields",
  "DFT benchmarks",
  "perovskite stability",
  "MLFF uncertainty",
  "materials informatics",
]

const trendingSearches = [
  "MACE-MP-0 release",
  "Battery electrolyte screening",
  "GNoME dataset analysis",
  "Phonon ML potentials",
]

export function MobileSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeQuery, submitSearch } = useSearchFilter()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearch(query)
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setQuery(activeQuery ?? "")
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="min-h-11 min-w-11 md:hidden"
          aria-label="Search"
        >
          <Search className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="h-[100dvh] p-0 pt-safe"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Search Materialist</SheetTitle>

        <form className="flex items-center gap-2 border-b border-border px-3 py-2" onSubmit={handleSubmit}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="min-h-11 min-w-11 shrink-0"
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Close search"
          >
            <X className="size-5" />
          </Button>
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search papers, discussions, tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-11 flex-1"
            autoFocus
          />
        </form>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!query.trim() ? (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Searches
                </h3>
                <ul className="space-y-0.5">
                  {recentSearches.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-sm text-foreground transition-colors hover:bg-accent touch-manipulation"
                        onClick={() => {
                          submitSearch(term)
                          setOpen(false)
                        }}
                      >
                        <Clock className="size-4 shrink-0 text-muted-foreground" />
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trending
                </h3>
                <ul className="space-y-0.5">
                  {trendingSearches.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-sm text-foreground transition-colors hover:bg-accent touch-manipulation"
                        onClick={() => {
                          submitSearch(term)
                          setOpen(false)
                        }}
                      >
                        <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
