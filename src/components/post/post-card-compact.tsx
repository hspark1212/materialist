"use client"

import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { ExternalLink, MessageSquare } from "lucide-react"

import type { Post } from "@/lib"
import { AuthorName } from "@/components/user/author-name"
import { BotBadge } from "@/components/user/bot-badge"
import { UserAvatar } from "@/components/user/user-avatar"
import { getSectionLabel, getSectionHref, flairByKey, jobTypeLabels, sectionByKey } from "@/lib/sections"
import { getPaperMetaLinks, getPostPreviewText, getPostPrimaryLink } from "@/components/post/post-feed-utils"
import { TagLink } from "@/components/post/post-tags"
import { ShareButton } from "@/components/post/share-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VoteButton } from "@/components/voting/vote-button"

type PostCardCompactProps = {
  post: Post
}

export function PostCardCompact({ post }: PostCardCompactProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const compactTimeAgo = timeAgo.replace(/^about\s+/i, "")
  const sectionColor = sectionByKey[post.section]?.color
  const previewText = getPostPreviewText(post.content, 180)
  const primaryLink = getPostPrimaryLink(post)
  const paperLinks = getPaperMetaLinks(post)
  const externalActionLabel = post.section === "papers" || post.type === "paper" ? "Paper" : "Link"

  return (
    <Card className="gap-0 bg-card/80 py-0 transition-colors hover:border-primary/30">
      <CardContent className="flex gap-2 px-3 py-2.5 sm:gap-2.5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <Badge
              asChild
              variant="secondary"
              className="max-w-24 truncate border px-1.5 py-0 sm:max-w-48"
              style={sectionColor ? { color: sectionColor, borderColor: sectionColor, backgroundColor: `color-mix(in srgb, ${sectionColor} 12%, transparent)` } : undefined}
            >
              <Link href={getSectionHref(post.section)}>{getSectionLabel(post.section)}</Link>
            </Badge>
            {post.flair && flairByKey[post.flair] ? (
              <Badge className={`hidden sm:inline-flex px-1.5 py-0 text-[11px] border-0 ${flairByKey[post.flair].className}`}>
                {flairByKey[post.flair].label}
              </Badge>
            ) : null}
            <UserAvatar user={post.author} size="sm" />
            <AuthorName user={post.author} />
            {post.author.isBot && !post.isAnonymous && <BotBadge />}
            <span>•</span>
            <span className="truncate">{compactTimeAgo}</span>
          </div>

          <Link href={`/post/${post.id}`} className="block line-clamp-1 text-sm font-semibold hover:text-primary">
            {post.title}
          </Link>

          {previewText ? (
            <p className="text-muted-foreground line-clamp-1 text-xs leading-relaxed">
              {previewText}
            </p>
          ) : null}

          {(paperLinks.length > 0 || (post.tags && post.tags.length > 0)) ? (
            <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-[11px]">
              {paperLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-border/70 bg-background/60 px-1.5 py-0.5 transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
              {post.tags?.map((tag) => (
                <TagLink key={tag} tag={tag} size="sm" />
              ))}
            </div>
          ) : null}

          {post.type === "job" && post.company ? (
            <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-medium text-foreground">{post.company}</span>
              {post.location ? <span>· {post.location}</span> : null}
              {post.jobType ? (
                <Badge variant="outline" className="text-[10px] px-1 py-0">{jobTypeLabels[post.jobType]}</Badge>
              ) : null}
              {post.deadline ? (
                isPast(new Date(post.deadline)) ? (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-muted text-muted-foreground">Closed</Badge>
                ) : (
                  <span className="text-muted-foreground">· Due: {format(new Date(post.deadline), "MMM d")}</span>
                )
              ) : null}
            </div>
          ) : null}

          <div className="text-muted-foreground flex items-center gap-2 pt-0.5 text-xs sm:pt-1">
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
            <Button asChild variant="ghost" size="sm" className="h-7 min-h-11 px-2 md:min-h-0">
              <Link href={`/post/${post.id}#comments`}>
                <MessageSquare className="size-3.5" />
                <span className="sm:hidden">{post.commentCount}</span>
                <span className="hidden sm:inline">{post.commentCount} Comments</span>
              </Link>
            </Button>
            <ShareButton
              postId={post.id}
              className="h-7 min-h-11 px-2 md:min-h-0"
              iconClassName="size-3.5"
              labelClassName="hidden sm:inline"
            />
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
