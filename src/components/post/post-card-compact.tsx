"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, MessageSquare } from "lucide-react"

import type { Post } from "@/lib"
import { getSectionLabel, getSectionHref, flairByKey, sectionByKey } from "@/lib/sections"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { VoteButton } from "@/components/voting/vote-button"

type PostCardCompactProps = {
  post: Post
}

export function PostCardCompact({ post }: PostCardCompactProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const sectionColor = sectionByKey[post.section]?.color

  return (
    <Card className="gap-0 bg-card/80 py-0 transition-colors hover:border-primary/30">
      <CardContent className="flex items-center gap-1.5 px-3 py-2.5 sm:gap-2">
        <VoteButton
          targetType="post"
          targetId={post.id}
          initialCount={post.voteCount}
          orientation="horizontal"
          size="sm"
          compact
        />

        <Link href={`/post/${post.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary">
          {post.title}
        </Link>

        <Badge
          asChild
          variant="secondary"
          className="max-w-24 truncate border sm:max-w-48"
          style={sectionColor ? { color: sectionColor, borderColor: sectionColor, backgroundColor: `color-mix(in srgb, ${sectionColor} 12%, transparent)` } : undefined}
        >
          <Link href={getSectionHref(post.section)}>{getSectionLabel(post.section)}</Link>
        </Badge>
        {post.flair && flairByKey[post.flair] ? (
          <Badge className={`hidden sm:inline-flex px-1.5 py-0 text-[11px] border-0 ${flairByKey[post.flair].className}`}>
            {flairByKey[post.flair].label}
          </Badge>
        ) : null}

        {post.url ? (
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open link"
            className="text-muted-foreground inline-flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors hover:bg-muted/40 hover:text-primary"
          >
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}

        <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] sm:text-xs">
          <MessageSquare className="size-3" />
          {post.commentCount}
        </span>

        <span className="text-muted-foreground hidden text-xs md:inline">{timeAgo}</span>
      </CardContent>
    </Card>
  )
}
