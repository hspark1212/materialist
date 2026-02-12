"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, MessageSquare } from "lucide-react"

import { cn, type Post } from "@/lib"
import { AuthorName } from "@/components/user/author-name"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSectionLabel, getSectionHref, flairByKey, jobTypeLabels, sectionByKey } from "@/lib/sections"
import { VoteButton } from "@/components/voting/vote-button"
import { ShareButton } from "@/components/post/share-button"

type PostCardProps = {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const compactTimeAgo = timeAgo.replace(/^about\s+/i, "")
  const sectionColor = sectionByKey[post.section]?.color
  const metaChips: Array<{ label: string; href: string; showIcon?: boolean }> = []
  const mobileTagLimit = 2
  const mobileHiddenTagCount = Math.max(0, post.tags.length - mobileTagLimit)
  const techStack = post.type === "showcase" ? post.techStack ?? [] : []
  const mobileTechLimit = 3
  const mobileHiddenTechCount = Math.max(0, techStack.length - mobileTechLimit)

  if (post.arxivId) {
    metaChips.push({
      label: `arXiv: ${post.arxivId}`,
      href: `https://arxiv.org/abs/${post.arxivId}`,
    })
  }

  if (post.doi) {
    metaChips.push({
      label: `DOI: ${post.doi}`,
      href: `https://doi.org/${post.doi}`,
    })
  }

  if (!post.arxivId && !post.doi && post.url) {
    metaChips.push({
      label: "Source",
      href: post.url,
      showIcon: true,
    })
  }

  return (
    <Card className="gap-0 bg-card/80 py-0 shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md">
      <CardContent className="flex gap-3 px-3 py-3 sm:px-5 sm:py-4">
        <VoteButton
          targetType="post"
          targetId={post.id}
          initialCount={post.voteCount}
          orientation="vertical"
          size="default"
          compact
        />

        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
          <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
            <Badge
              asChild
              variant="secondary"
              className="border px-2 py-0.5 text-[11px]"
              style={sectionColor ? { color: sectionColor, borderColor: sectionColor, backgroundColor: `color-mix(in srgb, ${sectionColor} 12%, transparent)` } : undefined}
            >
              <Link href={getSectionHref(post.section)}>{getSectionLabel(post.section)}</Link>
            </Badge>
            {post.flair && flairByKey[post.flair] ? (
              <Badge className={`px-1.5 py-0 text-[11px] border-0 ${flairByKey[post.flair].className}`}>
                {flairByKey[post.flair].label}
              </Badge>
            ) : null}
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Posted by</span>
            <AuthorName user={post.author} />
            <span>•</span>
            <span>{compactTimeAgo}</span>
          </div>

          <Link
            href={`/post/${post.id}`}
            className="block line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight hover:text-primary sm:line-clamp-none sm:text-lg"
          >
            {post.title}
          </Link>

          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag, index) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn("text-[11px] font-medium", index >= mobileTagLimit ? "hidden sm:inline-flex" : "")}
              >
                #{tag}
              </Badge>
            ))}
            {mobileHiddenTagCount > 0 ? (
              <Badge variant="outline" className="text-[11px] font-medium sm:hidden">
                +{mobileHiddenTagCount}
              </Badge>
            ) : null}
          </div>
          {metaChips.length ? (
            <div className="flex flex-wrap gap-1.5">
              {metaChips.map((chip) => (
                <Badge key={chip.href} asChild variant="secondary" className="gap-1 text-[11px]">
                  <a href={chip.href} target="_blank" rel="noreferrer">
                    {chip.showIcon ? <ExternalLink className="size-3" /> : null}
                    {chip.label}
                  </a>
                </Badge>
              ))}
            </div>
          ) : null}

          {post.type === "job" && post.company ? (
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{post.company}</span>
              {post.location ? <span>· {post.location}</span> : null}
              {post.jobType ? (
                <Badge variant="outline" className="text-[11px]">{jobTypeLabels[post.jobType]}</Badge>
              ) : null}
            </div>
          ) : null}
          {techStack.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {techStack.map((tech, index) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className={cn("text-[11px]", index >= mobileTechLimit ? "hidden sm:inline-flex" : "")}
                >
                  {tech}
                </Badge>
              ))}
              {mobileHiddenTechCount > 0 ? (
                <Badge variant="secondary" className="text-[11px] sm:hidden">
                  +{mobileHiddenTechCount}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="text-muted-foreground flex items-center gap-2 pt-0.5 text-xs sm:pt-1">
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
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
