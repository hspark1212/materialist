"use client"

import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { ExternalLink, MessageSquare } from "lucide-react"

import { cn, type Post } from "@/lib"
import { event } from "@/lib/analytics/gtag"
import { AuthorName } from "@/components/user/author-name"
import { BotBadge } from "@/components/user/bot-badge"
import { UserAvatar } from "@/components/user/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSectionLabel, getSectionHref, flairByKey, jobTypeLabels, sectionByKey } from "@/lib/sections"
import { getPaperMetaLinks, getPostPreviewText, getPostPrimaryLink } from "@/components/post/post-feed-utils"
import { InlineLatex } from "@/components/markdown/inline-latex"
import { TagLink } from "@/components/post/post-tags"
import { VoteButton } from "@/components/voting/vote-button"
import { ShareButton } from "@/components/post/share-button"

type PostCardProps = {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const compactTimeAgo = timeAgo.replace(/^about\s+/i, "")
  const sectionColor = sectionByKey[post.section]?.color
  const previewText = getPostPreviewText(post.content, 360)
  const primaryLink = getPostPrimaryLink(post)
  const paperLinks = getPaperMetaLinks(post)
  const externalActionLabel = post.section === "papers" || post.type === "paper" ? "Paper" : "Link"

  return (
    <Card className="group bg-card/80 hover:border-primary/30 relative gap-0 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="px-3 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0 space-y-1.5 sm:space-y-2">
          <div className="text-muted-foreground relative z-[1] flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
            <Badge
              asChild
              variant="secondary"
              className="border px-2 py-0.5 text-[11px]"
              style={
                sectionColor
                  ? {
                      color: sectionColor,
                      borderColor: sectionColor,
                      backgroundColor: `color-mix(in srgb, ${sectionColor} 12%, transparent)`,
                    }
                  : undefined
              }
            >
              <Link href={getSectionHref(post.section)}>{getSectionLabel(post.section)}</Link>
            </Badge>
            {post.flair && flairByKey[post.flair] ? (
              <Badge className={`border-0 px-1.5 py-0 text-[11px] ${flairByKey[post.flair].className}`}>
                {flairByKey[post.flair].label}
              </Badge>
            ) : null}
            {post.voteCount >= 3 || post.commentCount >= 3 ? (
              <Badge className="inline-flex animate-[hot-pulse_2s_ease-in-out_infinite] items-center gap-0.5 border-0 bg-orange-100 px-1.5 py-0 text-[11px] text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                <span className="text-[9px] leading-none">🔥</span>Hot
              </Badge>
            ) : null}
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Posted by</span>
            <UserAvatar user={post.author} size="sm" />
            <AuthorName user={post.author} />
            {post.author.isBot && !post.isAnonymous && <BotBadge />}
            <span>•</span>
            <span>{compactTimeAgo}</span>
          </div>

          <Link
            href={`/post/${post.id}`}
            className="hover:text-primary line-clamp-2 block text-[17px] leading-snug font-semibold tracking-tight after:absolute after:inset-0 after:content-[''] sm:line-clamp-none sm:text-lg"
            onClick={() => event("card_click", { post_id: post.id, section: post.section, card_type: "default" })}
          >
            <InlineLatex content={post.title} />
          </Link>

          {previewText ? (
            <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed sm:line-clamp-5">{previewText}</p>
          ) : null}

          {paperLinks.length > 0 || (post.tags && post.tags.length > 0) ? (
            <div className="text-muted-foreground relative z-[1] flex flex-wrap items-center gap-1.5 text-xs">
              {paperLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border/70 bg-background/70 hover:text-primary inline-flex items-center gap-1 rounded-full border px-2 py-0.5 transition-colors"
                >
                  {link.label}
                  <ExternalLink className="size-3" />
                </a>
              ))}
              {post.tags?.map((tag) => (
                <TagLink key={tag} tag={tag} />
              ))}
            </div>
          ) : null}

          {post.type === "job" && post.company ? (
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span className="text-foreground font-medium">{post.company}</span>
              {post.location ? <span>· {post.location}</span> : null}
              {post.jobType ? (
                <Badge variant="outline" className="text-[11px]">
                  {jobTypeLabels[post.jobType]}
                </Badge>
              ) : null}
              {post.deadline ? (
                isPast(new Date(post.deadline)) ? (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground text-[11px]">
                    Closed
                  </Badge>
                ) : (
                  <span>· Due: {format(new Date(post.deadline), "MMM d")}</span>
                )
              ) : null}
            </div>
          ) : null}

          <div className="text-muted-foreground relative z-[1] flex items-center gap-2 pt-0.5 text-xs sm:pt-1">
            <VoteButton
              targetType="post"
              targetId={post.id}
              initialCount={post.voteCount}
              initialUserVote={post.userVote ?? 0}
              orientation="horizontal"
              size="sm"
              compact
              countMode="net"
              className="h-7 min-h-11 px-1 md:min-h-0"
            />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn("h-7 min-h-11 px-2 md:min-h-0", post.commentCount > 0 && "text-foreground")}
            >
              <Link href={`/post/${post.id}#comments`}>
                <MessageSquare className="size-3.5" />
                <span className="sm:hidden">{post.commentCount}</span>
                <span className="hidden sm:inline">{post.commentCount} Comments</span>
              </Link>
            </Button>
            <ShareButton postId={post.id} className="h-7 min-h-11 px-2 md:min-h-0" iconClassName="size-3.5" />
            {primaryLink ? (
              <Button asChild variant="ghost" size="sm" className="h-7 min-h-11 px-2 md:min-h-0">
                <a href={primaryLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">{externalActionLabel}</span>
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
