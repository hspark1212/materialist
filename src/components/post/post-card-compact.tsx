"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, MessageSquare } from "lucide-react"

import type { Post } from "@/lib"
import { getSectionLabel, getSectionHref, flairByKey, sectionByKey } from "@/lib/sections"
import { getPaperMetaLinks, getPostPreviewText, getPostPrimaryLink } from "@/components/post/post-feed-utils"
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

          {paperLinks.length > 0 ? (
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
            </div>
          ) : null}

          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <VoteButton
              targetType="post"
              targetId={post.id}
              initialCount={post.voteCount}
              initialUserVote={post.userVote ?? 0}
              orientation="horizontal"
              size="sm"
              compact
              hideDownvote
              countMode="nonNegative"
              variant="reddit"
            />
            <Button asChild variant="ghost" size="sm" className="h-7 min-h-11 px-2 md:min-h-0">
              <Link href={`/post/${post.id}#comments`}>
                <MessageSquare className="size-3.5" />
                {post.commentCount}
              </Link>
            </Button>
            <ShareButton
              postId={post.id}
              className="h-7 min-h-11 px-2 md:min-h-0"
              iconClassName="size-3.5"
              labelClassName="hidden md:inline"
            />
            {primaryLink ? (
              <Button asChild variant="ghost" size="sm" className="h-7 min-h-11 px-2 md:min-h-0">
                <a href={primaryLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span className="hidden md:inline">{externalActionLabel}</span>
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
