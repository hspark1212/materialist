"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib"
import type { JobType } from "@/lib"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTrendingPapers } from "@/features/topics/presentation/use-trending-papers"
import { useTrendingPosts } from "@/features/topics/presentation/use-trending-posts"
import { useTrendingTopics } from "@/features/topics/presentation/use-trending-topics"
import {
  normalizeForumFlair,
  normalizeJobType,
  normalizeLocationFilter,
  normalizeShowcaseType,
  normalizeTag,
} from "@/features/posts/domain/query-normalization"
import {
  forumFlairs,
  jobLocationFilters,
  jobTypeLabels,
  sections,
  sectionByKey,
  showcaseTypeFilters,
  showcaseTypeLabels,
} from "@/lib/sections"

type LeftSidebarProps = {
  inSheet?: boolean
}

type TrendingPaperSource = {
  label: "arXiv" | "DOI" | "Link" | "Post"
  detail: string | null
  badgeClassName: string
}

type SidebarQueryParam = "tag" | "flair" | "showcaseType" | "jobType" | "location"

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
  const end = value.slice(-Math.floor((maxLength - 1) / 2))
  return `${start}...${end}`
}

function getPaperSourceMeta(paper: {
  arxiv_id: string | null
  doi: string | null
  url: string | null
}): TrendingPaperSource {
  if (paper.arxiv_id) {
    const arxivId = paper.arxiv_id.trim().replace(/^arxiv:/i, "")
    return {
      label: "arXiv",
      detail: arxivId || null,
      badgeClassName:
        "border-sky-200 bg-sky-100/70 text-sky-800 dark:border-sky-900/70 dark:bg-sky-900/20 dark:text-sky-200",
    }
  }

  if (paper.doi) {
    return {
      label: "DOI",
      detail: truncateMiddle(paper.doi.trim(), 28),
      badgeClassName:
        "border-violet-200 bg-violet-100/70 text-violet-800 dark:border-violet-900/70 dark:bg-violet-900/20 dark:text-violet-200",
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
      badgeClassName:
        "border-emerald-200 bg-emerald-100/70 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-900/20 dark:text-emerald-200",
    }
  }

  return {
    label: "Post",
    detail: null,
    badgeClassName: "border-border bg-muted/80 text-muted-foreground",
  }
}

function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="border-border/40 bg-background/40 rounded-lg border px-2.5 py-2">
          <div className="bg-muted mb-1.5 h-2 w-20 animate-pulse rounded" />
          <div className="bg-muted h-3 w-full animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full cursor-pointer items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/70 bg-secondary/60 text-secondary-foreground hover:bg-accent",
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  )
}

export function LeftSidebar({ inSheet = false }: LeftSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSection = getActiveSection(pathname)
  const activeTag = normalizeTag(searchParams.get("tag"))
  const activeFlair = normalizeForumFlair(searchParams.get("flair"))
  const activeShowcaseType = normalizeShowcaseType(searchParams.get("showcaseType"))
  const activeJobType = normalizeJobType(searchParams.get("jobType"))
  const activeLocation = normalizeLocationFilter(searchParams.get("location"))
  const { topics: trendingTopics, loading: topicsLoading, error: topicsError } = useTrendingTopics(8, 7)
  const { papers: trendingPapers, loading: papersLoading, error: papersError } = useTrendingPapers(3, 30)
  const { posts: trendingPosts, loading: postsLoading, error: postsError } = useTrendingPosts(3, 30)

  const navCardClassName = "space-y-3 rounded-xl border border-border/70 bg-transparent p-3"
  const panelCardClassName = "space-y-2.5 rounded-xl border border-border/60 bg-transparent p-3"
  const headingClassName = "text-[12px] font-semibold tracking-[0.02em] text-foreground/90"
  const descriptionClassName = "text-[11px] leading-relaxed text-muted-foreground"
  const sheetScrollAreaClassName = "h-full border-r border-border"

  const updateParam = (key: SidebarQueryParam, value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false })
  }

  const content = (
    <div className="space-y-3.5 px-3 py-4 md:px-4">
      <section className={navCardClassName}>
        <div className="space-y-1">
          <h2 className={headingClassName}>Browse Sections</h2>
          <p className={descriptionClassName}>Move between papers, discussions, showcases, and jobs.</p>
        </div>
        <div className="space-y-1">
          {sections.map((section) => {
            const isActive = activeSection === section.key
            const Icon = section.icon
            return (
              <Link
                key={section.key}
                href={section.href}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "border-border bg-background/85 text-foreground shadow-sm"
                    : "text-foreground/90 hover:border-border/70 hover:bg-background/70 border-transparent",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{section.label}</span>
                </span>
                <span
                  className="inline-block size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: section.color }}
                />
              </Link>
            )
          })}
        </div>
      </section>

      {activeSection === null ? (
        <section className={panelCardClassName}>
          <h2 className={headingClassName}>Trending Posts</h2>
          {postsLoading ? (
            <LoadingRows />
          ) : postsError ? (
            <p className="text-destructive text-xs">Failed to load posts</p>
          ) : trendingPosts.length > 0 ? (
            <ul className="space-y-1.5">
              {trendingPosts.map((post) => (
                <li key={post.id} className="list-none">
                  <Link
                    href={`/post/${post.id}`}
                    className="group hover:border-border/80 hover:bg-accent/40 block rounded-lg border border-transparent px-2.5 py-2 transition-colors"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                        <span
                          className="inline-block size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: sectionByKey[post.section].color }}
                        />
                        {sectionByKey[post.section].label}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-[11px]">{post.vote_count} votes</span>
                    </div>
                    <p className="group-hover:text-primary line-clamp-2 text-sm leading-snug transition-colors">
                      {post.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">No trending posts yet</p>
          )}
        </section>
      ) : activeSection === "papers" ? (
        <section className={panelCardClassName}>
          <h2 className={headingClassName}>Trending Papers</h2>
          {papersLoading ? (
            <LoadingRows />
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
                      className="group hover:border-border/80 hover:bg-accent/40 block rounded-lg border border-transparent px-2.5 py-2 transition-colors"
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
                        <span className="text-muted-foreground shrink-0 text-[11px]">{paper.vote_count} votes</span>
                      </div>
                      <p className="group-hover:text-primary line-clamp-2 text-sm leading-snug transition-colors">
                        {paper.title}
                      </p>
                      {source.detail ? (
                        <p className="text-muted-foreground mt-1 line-clamp-1 text-[11px]">{source.detail}</p>
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
        <section className={panelCardClassName}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={headingClassName}>Flairs</h2>
            {activeFlair ? (
              <button
                type="button"
                onClick={() => updateParam("flair", undefined)}
                className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            {forumFlairs.map((flair) => (
              <button
                key={flair.key}
                type="button"
                aria-pressed={activeFlair === flair.key}
                onClick={() => updateParam("flair", activeFlair === flair.key ? undefined : flair.key)}
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                  flair.className,
                  activeFlair === flair.key
                    ? "border-primary/40 ring-primary/30 ring-1"
                    : "border-transparent opacity-85 hover:opacity-100",
                )}
              >
                {flair.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeSection === "showcase" ? (
        <section className={panelCardClassName}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={headingClassName}>Type</h2>
            {activeShowcaseType ? (
              <button
                type="button"
                onClick={() => updateParam("showcaseType", undefined)}
                className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            {showcaseTypeFilters.map((type) => (
              <FilterChip
                key={type}
                label={showcaseTypeLabels[type]}
                active={activeShowcaseType === type}
                onClick={() => updateParam("showcaseType", activeShowcaseType === type ? undefined : type)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {activeSection === "jobs" ? (
        <section className={panelCardClassName}>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className={headingClassName}>Job Type</h2>
              {activeJobType ? (
                <button
                  type="button"
                  onClick={() => updateParam("jobType", undefined)}
                  className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {(["postdoc", "phd", "full-time", "internship", "remote"] as JobType[]).map((type) => (
                <FilterChip
                  key={type}
                  label={jobTypeLabels[type]}
                  active={activeJobType === type}
                  onClick={() => updateParam("jobType", activeJobType === type ? undefined : type)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className={headingClassName}>Location</h2>
              {activeLocation ? (
                <button
                  type="button"
                  onClick={() => updateParam("location", undefined)}
                  className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {jobLocationFilters.map((location) => (
                <FilterChip
                  key={location}
                  label={location}
                  active={activeLocation === location}
                  onClick={() => updateParam("location", activeLocation === location ? undefined : location)}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={panelCardClassName}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={headingClassName}>Trending Topics</h2>
          {activeTag ? (
            <button
              type="button"
              onClick={() => updateParam("tag", undefined)}
              className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
            >
              Clear
            </button>
          ) : null}
        </div>
        {topicsLoading ? (
          <LoadingRows rows={4} />
        ) : topicsError ? (
          <p className="text-destructive text-xs">Failed to load topics</p>
        ) : trendingTopics.length === 0 ? (
          <p className="text-muted-foreground text-xs">No trending topics yet</p>
        ) : (
          <div className="flex min-w-0 flex-wrap gap-2">
            {trendingTopics.map((topic) => {
              const rawTag = topic.tag.replace(/^#/, "")
              const isActive = activeTag === rawTag
              return (
                <FilterChip
                  key={topic.tag}
                  label={topic.tag}
                  active={isActive}
                  onClick={() => updateParam("tag", isActive ? undefined : rawTag)}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )

  if (inSheet) {
    return <ScrollArea className={sheetScrollAreaClassName}>{content}</ScrollArea>
  }

  return <div className="sticky top-[calc(var(--header-height)+0.25rem)]">{content}</div>
}
