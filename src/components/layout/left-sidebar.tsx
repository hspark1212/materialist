"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib"
import { useTrendingPapers } from "@/features/topics/presentation/use-trending-papers"
import { useTrendingTopics } from "@/features/topics/presentation/use-trending-topics"
import {
  sections,
  forumFlairs,
  showcaseTypeFilters,
  showcaseTypeLabels,
  jobTypeLabels,
  jobLocationFilters,
} from "@/lib/sections"
import type { JobType } from "@/lib"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type LeftSidebarProps = {
  inSheet?: boolean
}

type TrendingPaperSource = {
  label: "arXiv" | "DOI" | "Link" | "Post"
  detail: string | null
  badgeClassName: string
}

function getActiveSection(pathname: string): string | null {
  for (const section of sections) {
    if (pathname === section.href || pathname.startsWith(section.href + "/")) {
      return section.key
    }
  }
  return null
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value

  const start = value.slice(0, Math.ceil((maxLength - 1) / 2))
  const end = value.slice(-(Math.floor((maxLength - 1) / 2)))
  return `${start}...${end}`
}

function getPaperSourceMeta(paper: { arxiv_id: string | null; doi: string | null; url: string | null }): TrendingPaperSource {
  if (paper.arxiv_id) {
    const arxivId = paper.arxiv_id.trim().replace(/^arxiv:/i, "")
    return {
      label: "arXiv",
      detail: arxivId || null,
      badgeClassName: "border-sky-200 bg-sky-100/70 text-sky-800 dark:border-sky-900/70 dark:bg-sky-900/20 dark:text-sky-200",
    }
  }

  if (paper.doi) {
    return {
      label: "DOI",
      detail: truncateMiddle(paper.doi.trim(), 28),
      badgeClassName: "border-violet-200 bg-violet-100/70 text-violet-800 dark:border-violet-900/70 dark:bg-violet-900/20 dark:text-violet-200",
    }
  }

  if (paper.url) {
    let host = paper.url
    try {
      host = new URL(paper.url).hostname.replace(/^www\./, "")
    } catch {
      // Keep original value when URL parsing fails.
    }
    return {
      label: "Link",
      detail: truncateMiddle(host, 28),
      badgeClassName: "border-emerald-200 bg-emerald-100/70 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-900/20 dark:text-emerald-200",
    }
  }

  return {
    label: "Post",
    detail: null,
    badgeClassName: "border-border bg-muted/80 text-muted-foreground",
  }
}

export function LeftSidebar({ inSheet = false }: LeftSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTag = searchParams.get("tag")
  const activeSection = getActiveSection(pathname)
  const { topics: trendingTopics, loading: topicsLoading, error: topicsError } = useTrendingTopics(8, 7)
  const { papers: trendingPapers, loading: papersLoading, error: papersError } = useTrendingPapers(3, 30)
  const blockClassName = "space-y-2.5 rounded-lg border border-border/70 bg-background/70 p-3"
  const headingClassName = "text-muted-foreground text-[11px] font-semibold tracking-wide uppercase"
  const scrollAreaClassName = inSheet ? "h-full border-r border-border bg-card/80" : "h-full bg-card/50"

  const content = (
    <ScrollArea className={scrollAreaClassName}>
      <div className="space-y-3 px-4 pb-4 pt-1">
        <section className={blockClassName}>
          <h2 className={headingClassName}>
            Sections
          </h2>
          <div className="space-y-1">
            {sections.map((s) => {
              const isActive = activeSection === s.key
              const Icon = s.icon
              return (
                <Link
                  key={s.key}
                  href={s.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent/80 text-foreground font-medium"
                      : "text-foreground/90 hover:bg-accent/50"
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {s.label}
                </Link>
              )
            })}
          </div>
        </section>

        {activeSection === null || activeSection === "papers" ? (
          <section className={blockClassName}>
            <h2 className={headingClassName}>
              Trending Papers
            </h2>
            {papersLoading ? (
              <p className="text-muted-foreground text-xs">Loading...</p>
            ) : papersError ? (
              <p className="text-destructive text-xs">Failed to load papers</p>
            ) : trendingPapers.length > 0 ? (
              <ul className="space-y-1.5">
                {trendingPapers.map((paper) => {
                  const source = getPaperSourceMeta(paper)
                  const isExternal = !paper.href.startsWith("/")

                  return (
                    <li key={paper.id} className="list-none">
                      <Link
                        href={paper.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                        className="group block rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border/80 hover:bg-accent/45"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                              source.badgeClassName,
                            )}
                          >
                            {source.label}
                          </span>
                          <span className="text-muted-foreground shrink-0 text-[11px]">
                            {paper.vote_count} votes
                          </span>
                        </div>
                        <p className="line-clamp-3 text-sm leading-snug transition-colors group-hover:text-primary">
                          {paper.title}
                        </p>
                        {source.detail ? (
                          <p className="text-muted-foreground mt-1 line-clamp-1 text-[11px]">
                            {source.detail}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">No trending papers this week</p>
            )}
          </section>
        ) : null}

        {activeSection === "forum" ? (
          <section className={blockClassName}>
            <h2 className={headingClassName}>
              Flairs
            </h2>
            <div className="space-y-1">
              {forumFlairs.map((flair) => (
                <button
                  key={flair.key}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent/50"
                >
                  <Badge className={`h-5 border-0 px-2 text-[11px] ${flair.className}`}>
                    {flair.label}
                  </Badge>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "showcase" ? (
          <section className={blockClassName}>
            <h2 className={headingClassName}>
              Type
            </h2>
            <div className="flex flex-wrap gap-2">
              {showcaseTypeFilters.map((type) => (
                <Badge key={type} variant="secondary" className="cursor-pointer text-[11px] hover:bg-accent/70">
                  {showcaseTypeLabels[type]}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "jobs" ? (
          <section className={blockClassName}>
            <h2 className={headingClassName}>
              Job Type
            </h2>
            <div className="flex flex-wrap gap-2">
              {(["postdoc", "phd", "full-time", "internship", "remote"] as JobType[]).map((type) => (
                <Badge key={type} variant="secondary" className="cursor-pointer text-[11px] hover:bg-accent/70">
                  {jobTypeLabels[type]}
                </Badge>
              ))}
            </div>
            <h2 className={headingClassName}>
              Location
            </h2>
            <div className="flex flex-wrap gap-2">
              {jobLocationFilters.map((loc) => (
                <Badge key={loc} variant="secondary" className="cursor-pointer text-[11px] hover:bg-accent/70">
                  {loc}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        <section className={blockClassName}>
          <h2 className={headingClassName}>
            Trending Topics
          </h2>
          {topicsLoading ? (
            <p className="text-muted-foreground text-xs">Loading...</p>
          ) : topicsError ? (
            <p className="text-destructive text-xs">Failed to load topics</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic) => {
                const rawTag = topic.tag.replace(/^#/, "")
                const isActive = activeTag === rawTag
                return (
                  <Badge
                    key={topic.tag}
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      "cursor-pointer font-mono text-[11px] transition-colors",
                      isActive ? "" : "hover:bg-accent/70"
                    )}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      if (isActive) {
                        params.delete("tag")
                      } else {
                        params.set("tag", rawTag)
                      }
                      const qs = params.toString()
                      router.push(`${pathname}${qs ? `?${qs}` : ""}`)
                    }}
                  >
                    {topic.tag}
                  </Badge>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </ScrollArea>
  )

  if (inSheet) {
    return content
  }

  return (
    <div className="sticky top-[var(--header-height)] h-[calc(100vh-var(--header-height))]">
      {content}
    </div>
  )
}
