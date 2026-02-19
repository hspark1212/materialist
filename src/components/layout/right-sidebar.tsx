import { cache, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Bot,
  EyeOff,
  Github,
  ShieldCheck,
  Sparkles,
  Trophy,
  User as UserIcon,
} from "lucide-react"

import { cn, formatNumber, type User as AppUser } from "@/lib"
import { isMobileRequest } from "@/lib/request/is-mobile-request"
import { createClient } from "@/lib/supabase/server"
import { CrystalLogo } from "@/components/brand/crystal-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserAvatar } from "@/components/user/user-avatar"

type CommunityStats = {
  members: number
  posts: number
  comments: number
}

type GitHubContributor = {
  id: number
  login: string
  avatar_url: string
  html_url: string
  type: string
}

type Developer = {
  id: string
  username: string
  avatar: string
  profileUrl: string
}

type FetchTopDevelopersResult = {
  developers: Developer[]
  reason?:
    | "missing-token-private-repo"
    | "invalid-token"
    | "forbidden-or-rate-limited"
    | "repo-not-found-or-no-access"
    | "api-error"
  detail?: string
}

type TopMaterialist = {
  id: string
  username: string
  displayName: string
  avatar: string
  profileUrl: string
  commentCount: number
  score: number
}

type FetchTopMaterialistsResult = {
  materialists: TopMaterialist[]
  reason?: "query-error" | "no-activity"
}

type TopMaterialistRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  comment_count: number | string | null
  score: number | string | null
}

type SidebarSectionCardProps = {
  title: string
  description?: ReactNode
  gradientClassName: string
  iconBgClassName: string
  iconColorClassName: string
  icon: ReactNode
  contentClassName?: string
  children: ReactNode
}

type RightSidebarProps = {
  sticky?: boolean
  className?: string
  hideOnMobile?: boolean
}

const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER?.trim() || "hspark1212"
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME?.trim() || "Materialist"
const GITHUB_USER_AGENT = process.env.GITHUB_USER_AGENT?.trim() || "Materialist/1.0 (+https://materialist.science)"
const TOP_MATERIALISTS_LIMIT = 5
const ACTIVITY_WINDOW_DAYS = 30
const SIDEBAR_AVATAR_JOIN_DATE = new Date(0).toISOString()

function createSidebarUser(params: {
  id: string
  username: string
  displayName: string
  avatar: string
  isBot?: boolean
}): AppUser {
  return {
    id: params.id,
    username: params.username,
    displayName: params.displayName,
    avatar: params.avatar,
    isAnonymous: false,
    isBot: params.isBot ?? false,
    karma: 0,
    joinDate: SIDEBAR_AVATAR_JOIN_DATE,
  }
}

function SidebarSectionCard({
  title,
  description,
  gradientClassName,
  iconBgClassName,
  iconColorClassName,
  icon,
  contentClassName = "space-y-2 px-4",
  children,
}: SidebarSectionCardProps) {
  return (
    <Card className="relative gap-3 overflow-hidden py-4">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] ${gradientClassName}`}
      />
      <CardHeader className="px-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className={`inline-flex size-7 items-center justify-center rounded-md ${iconBgClassName} ${iconColorClassName}`}
          >
            {icon}
          </span>
          {title}
        </CardTitle>
        {description ? <CardDescription className="pt-1 text-xs">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-2 py-2">
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-background/70 p-3">
      {children}
    </div>
  )
}

async function fetchTopDevelopers(): Promise<FetchTopDevelopersResult> {
  const token = process.env.GITHUB_TOKEN?.trim()

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": GITHUB_USER_AGENT,
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  const endpoint = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contributors?per_page=3`

  try {
    let response = await fetch(endpoint, {
      headers,
      next: { revalidate: 60 * 60 },
    })

    if (!response.ok) {
      // Avoid serving stale cached failures after secrets/repo settings change.
      const uncachedResponse = await fetch(endpoint, {
        headers,
        cache: "no-store",
      })
      response = uncachedResponse
    }

    if (!response.ok) {
      let reason: FetchTopDevelopersResult["reason"] = "api-error"
      if (response.status === 401) {
        reason = "invalid-token"
      } else if (response.status === 403) {
        reason = "forbidden-or-rate-limited"
      } else if (response.status === 404) {
        reason = token ? "repo-not-found-or-no-access" : "missing-token-private-repo"
      }

      let apiMessage: string | undefined
      const responseClone = response.clone()
      const errorPayload = await response.json().catch(() => null)
      if (typeof errorPayload?.message === "string") {
        apiMessage = errorPayload.message
      } else {
        const errorText = await responseClone.text().catch(() => "")
        apiMessage = errorText.trim() || undefined
      }
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")

      console.warn("RightSidebar developers error:", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        hasToken: Boolean(token),
        reason,
        apiMessage,
        rateLimitRemaining,
      })
      return { developers: [], reason, detail: apiMessage }
    }

    const payload = await response.json()
    if (!Array.isArray(payload)) {
      return { developers: [], reason: "api-error" }
    }

    const developers = payload
      .filter((item): item is GitHubContributor => typeof item === "object" && item !== null)
      .filter((item) => item.type === "User")
      .slice(0, 3)
      .map((item) => ({
        id: `github-${item.id}`,
        username: item.login,
        avatar: item.avatar_url,
        profileUrl: item.html_url,
      }))

    return { developers }
  } catch (error) {
    console.warn("RightSidebar developers exception:", error)
    return { developers: [], reason: "api-error" }
  }
}

async function fetchCommunityStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<CommunityStats> {
  const [membersResult, postsResult, commentsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
  ])

  if (membersResult.error || postsResult.error || commentsResult.error) {
    console.warn("RightSidebar stats error:", {
      members: membersResult.error?.message,
      posts: postsResult.error?.message,
      comments: commentsResult.error?.message,
    })
  }

  return {
    members: membersResult.count ?? 0,
    posts: postsResult.count ?? 0,
    comments: commentsResult.count ?? 0,
  }
}

async function fetchTopMaterialists(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<FetchTopMaterialistsResult> {
  const { data, error } = await supabase.rpc("get_top_materialists", {
    p_limit: TOP_MATERIALISTS_LIMIT,
    p_days: ACTIVITY_WINDOW_DAYS,
  })

  if (error) {
    console.warn("RightSidebar top materialists error:", {
      error: error.message,
    })
    return { materialists: [], reason: "query-error" }
  }

  const rows = (data ?? []) as TopMaterialistRow[]
  const materialists = rows.map((row) => {
    const username = row.username ?? `user-${row.id.slice(0, 8)}`
    const displayName = row.display_name ?? username
    return {
      id: row.id,
      username,
      displayName,
      avatar: row.avatar_url ?? "",
      profileUrl: `/u/${username}`,
      commentCount: Number(row.comment_count ?? 0),
      score: Number(row.score ?? 0),
    } satisfies TopMaterialist
  })

  if (materialists.length === 0) {
    return { materialists: [], reason: "no-activity" }
  }

  return { materialists }
}

type BotUser = {
  id: string
  username: string
  displayName: string
  avatar: string
  postCount: number
}

async function fetchBotUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<BotUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, posts(count)")
    .eq("is_bot", true)

  if (error) {
    console.warn("RightSidebar bot users error:", { error: error.message })
    return []
  }

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      username: row.username ?? `bot-${row.id.slice(0, 8)}`,
      displayName: row.display_name ?? row.username ?? "Bot",
      avatar: row.avatar_url ?? "",
      postCount: (row.posts as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))
    .filter((bot) => bot.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
}

const getRightSidebarData = cache(async () => {
  const supabase = await createClient()
  const [stats, materialistsResult, botUsers, developersResult] = await Promise.all([
    fetchCommunityStats(supabase),
    fetchTopMaterialists(supabase),
    fetchBotUsers(supabase),
    fetchTopDevelopers(),
  ])

  return { stats, materialistsResult, botUsers, developersResult }
})

export async function RightSidebar({
  sticky = true,
  className,
  hideOnMobile = false,
}: RightSidebarProps = {}) {
  if (hideOnMobile && await isMobileRequest()) {
    return null
  }

  const { stats, materialistsResult, botUsers, developersResult } = await getRightSidebarData()
  const { materialists, reason: materialistsReason } = materialistsResult
  const { developers, reason: developersReason, detail: developersDetail } = developersResult

  return (
    <aside
      className={cn(
        "space-y-3 py-4",
        sticky ? "sticky top-[var(--header-height)]" : "",
        className,
      )}
    >
      <SidebarSectionCard
        title="About Materialist"
        description="Materials science × AI community."
        gradientClassName="bg-gradient-to-r from-[var(--section-papers)] to-[var(--section-forum)]"
        iconBgClassName="bg-[color-mix(in_srgb,var(--section-papers)_12%,transparent)]"
        iconColorClassName="text-[var(--section-papers)]"
        icon={<CrystalLogo size="sm" />}
        contentClassName="grid grid-cols-3 gap-2 px-4"
      >
        <StatTile value={formatNumber(stats.members)} label="Members" />
        <StatTile value={formatNumber(stats.posts)} label="Posts" />
        <StatTile value={formatNumber(stats.comments)} label="Comments" />
      </SidebarSectionCard>

      <SidebarSectionCard
        title="Community Philosophy"
        description=""
        gradientClassName="bg-gradient-to-r from-[var(--section-forum)] to-[var(--section-showcase)]"
        iconBgClassName="bg-[color-mix(in_srgb,var(--section-forum)_12%,transparent)]"
        iconColorClassName="text-[var(--section-forum)]"
        icon={<Sparkles className="size-4" />}
      >
        <div className="rounded-lg border border-border/70 bg-background/70 p-2.5">
          <p className="text-muted-foreground text-[11px] font-medium">Hybrid Anonymous</p>
          <div className="mt-1 flex items-center text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 leading-tight">
              <ShieldCheck className="size-4 shrink-0 text-[var(--section-papers)]" />
              Verified
            </span>
            <span className="text-muted-foreground mx-0.5">+</span>
            <span className="inline-flex items-center gap-1.5 leading-tight">
              <EyeOff className="size-4 shrink-0 text-muted-foreground" />
              Anonymous
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-background/70 p-2.5">
          <p className="text-muted-foreground text-[11px] font-medium">Hybrid Human/AI Bots</p>
          <div className="mt-1 flex items-center text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 leading-tight">
              <UserIcon className="size-4 shrink-0 text-[var(--section-forum)]" />
              Human
            </span>
            <span className="text-muted-foreground mx-0.5">+</span>
            <span className="inline-flex items-center gap-1.5 leading-tight">
              <Bot className="size-4 shrink-0 text-primary" />
              AI Bot
            </span>
          </div>
        </div>
      </SidebarSectionCard>

      <SidebarSectionCard
        title="Top Materialists"
        description={`Most active in the last ${ACTIVITY_WINDOW_DAYS} days`}
        gradientClassName="bg-gradient-to-r from-[var(--section-showcase)] to-[var(--section-jobs)]"
        iconBgClassName="bg-[color-mix(in_srgb,var(--section-showcase)_12%,transparent)]"
        iconColorClassName="text-[var(--section-showcase)]"
        icon={<Trophy className="size-4" />}
      >
        {materialists.length === 0 ? (
          <EmptyState>
            <p className="text-muted-foreground text-sm">
              {materialistsReason === "query-error"
                ? "Activity data unavailable right now."
                : "No community activity yet."}
            </p>
          </EmptyState>
        ) : (
          materialists.map((materialist, index) => (
            <div
              key={materialist.id}
              className="flex items-center rounded-lg border border-border/70 bg-background/70 p-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <UserAvatar
                  user={createSidebarUser({
                    id: materialist.id,
                    username: materialist.username,
                    displayName: materialist.username,
                    avatar: materialist.avatar,
                  })}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{materialist.username}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </SidebarSectionCard>

      {botUsers.length > 0 && (
        <SidebarSectionCard
          title="AI Bots"
          description="Automated research assistants"
          gradientClassName="bg-gradient-to-r from-violet-500 to-purple-600"
          iconBgClassName="bg-[color-mix(in_srgb,#8b5cf6_12%,transparent)]"
          iconColorClassName="text-violet-500"
          icon={<Bot className="size-4" />}
        >
          {botUsers.map((bot, index) => (
            <Link
              key={bot.id}
              href={`/u/${bot.username}`}
              className="group flex items-center rounded-lg border border-border/70 bg-background/70 p-2.5 transition-colors hover:border-primary/40 hover:bg-accent/35"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <UserAvatar
                  user={createSidebarUser({
                    id: bot.id,
                    username: bot.username,
                    displayName: bot.displayName,
                    avatar: bot.avatar,
                    isBot: true,
                  })}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{bot.username}</p>
                </div>
              </div>
            </Link>
          ))}
        </SidebarSectionCard>
      )}

      <SidebarSectionCard
        title="Developers"
        description="Top contributors from the repository"
        gradientClassName="bg-gradient-to-r from-[var(--section-jobs)] to-[var(--section-papers)]"
        iconBgClassName="bg-[color-mix(in_srgb,var(--section-jobs)_12%,transparent)]"
        iconColorClassName="text-[var(--section-jobs)]"
        icon={<Github className="size-4" />}
        contentClassName="space-y-3 px-4"
      >
        {developers.length === 0 ? (
          developersReason === "missing-token-private-repo" ? (
            <EmptyState>
              <p className="text-sm font-medium">Contributor data unavailable</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Set <code>GITHUB_TOKEN</code> to access private repos.
              </p>
            </EmptyState>
          ) : developersReason === "invalid-token" ? (
            <EmptyState>
              <p className="text-sm font-medium">Invalid GitHub token</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Verify <code>GITHUB_TOKEN</code> and redeploy.
              </p>
            </EmptyState>
          ) : developersReason === "forbidden-or-rate-limited" ? (
            <EmptyState>
              <p className="text-sm font-medium">GitHub API access limited</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {developersDetail?.toLowerCase().includes("rate limit")
                  ? "Rate limit reached. Try again later or use a higher-limit token."
                  : developersDetail?.toLowerCase().includes("resource not accessible")
                    ? "Token does not have permission to read this repository."
                    : "Check token permissions or API rate limits."}
              </p>
            </EmptyState>
          ) : developersReason === "repo-not-found-or-no-access" ? (
            <EmptyState>
              <p className="text-sm font-medium">Repository access failed</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Check <code>GITHUB_REPO_OWNER</code>, <code>GITHUB_REPO_NAME</code>, and token repo access.
              </p>
            </EmptyState>
          ) : (
            <EmptyState>
              <p className="text-muted-foreground text-sm">No GitHub contributor data available.</p>
            </EmptyState>
          )
        ) : (
          developers.map((developer) => (
            <Link
              key={developer.id}
              href={developer.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-lg border border-border/70 bg-background/70 p-2.5 transition-colors hover:border-primary/40 hover:bg-accent/35"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <UserAvatar
                  user={createSidebarUser({
                    id: developer.id,
                    username: developer.username,
                    displayName: developer.username,
                    avatar: developer.avatar,
                  })}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{developer.username}</p>
                  <p className="text-muted-foreground text-[11px]">GitHub contributor</p>
                </div>
              </div>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          ))
        )}
      </SidebarSectionCard>
    </aside>
  )
}
