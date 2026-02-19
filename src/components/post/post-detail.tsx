"use client"

import { useState } from "react"
import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { Pencil, Trash2, ExternalLink, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Post } from "@/lib"
import { getSectionLabel, getSectionHref, flairByKey, jobTypeLabels, showcaseTypeLabels, sectionByKey } from "@/lib/sections"
import { InlineLatex } from "@/components/markdown/inline-latex"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { getPaperMetaLinks, getPostPrimaryLink } from "@/components/post/post-feed-utils"
import { TagLink } from "@/components/post/post-tags"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AuthorName } from "@/components/user/author-name"
import { UserAvatar } from "@/components/user/user-avatar"
import { VoteButton } from "@/components/voting/vote-button"
import { ShareButton } from "@/components/post/share-button"

type PostDetailProps = {
  post: Post
}

const PAPER_CONTENT_SECTIONS: Array<{ heading: string; pattern: RegExp }> = [
  {
    heading: "Summary",
    pattern: /(^|\n)\s*(?:\*\*|__)?summary(?:\*\*|__)?\s*:(?:\*\*|__)?\s*/gi,
  },
  {
    heading: "Why this paper?",
    pattern: /(^|\n)\s*(?:\*\*|__)?why\s+this\s+paper\??(?:\*\*|__)?\s*:(?:\*\*|__)?\s*/gi,
  },
  {
    heading: "Abstract",
    pattern: /(^|\n)\s*(?:\*\*|__)?abstract(?:\*\*|__)?\s*:(?:\*\*|__)?\s*/gi,
  },
]

function normalizePaperDigestContent(content: string): string {
  if (/(^|\n)\s{0,3}#{1,6}\s+\S/m.test(content)) return content

  let normalized = content

  for (const { heading, pattern } of PAPER_CONTENT_SECTIONS) {
    normalized = normalized.replace(pattern, `$1## ${heading}\n\n`)
  }

  return normalized.replace(/\n{3,}/g, "\n\n").trim()
}

export function PostDetail({ post }: PostDetailProps) {
  const router = useRouter()
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const sectionColor = sectionByKey[post.section]?.color
  const primaryLink = getPostPrimaryLink(post)
  const paperMeta = getPaperMetaLinks(post)[0] ?? null
  const renderedContent = post.section === "papers" ? normalizePaperDigestContent(post.content) : post.content

  const isEdited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000
  const isOwnPost = Boolean(post.isOwner)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(payload.error ?? "Failed to delete post")
        return
      }
      router.push("/")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <Card className="gap-0 bg-card/80 py-0 shadow-sm">
      <CardContent className="px-4 py-5 sm:px-8 sm:py-7">
        <div className="mx-auto w-full max-w-[72ch] min-w-0 space-y-5">
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <Badge
              asChild
              variant="secondary"
              className="border px-2.5 py-0.5 text-[11px]"
              style={sectionColor ? { color: sectionColor, borderColor: sectionColor, backgroundColor: `color-mix(in srgb, ${sectionColor} 12%, transparent)` } : undefined}
            >
              <Link href={getSectionHref(post.section)}>{getSectionLabel(post.section)}</Link>
            </Badge>
            {post.flair && flairByKey[post.flair] ? (
              <Badge className={`px-1.5 py-0 text-[11px] border-0 ${flairByKey[post.flair].className}`}>
                {flairByKey[post.flair].label}
              </Badge>
            ) : null}
            <span>•</span>
            <div className="flex items-center gap-2">
              <UserAvatar user={post.author} size="sm" />
              <AuthorName user={post.author} />
            </div>
            <span>•</span>
            <span>{timeAgo}</span>
            {isEdited ? <span className="italic">(edited)</span> : null}

            {isOwnPost ? (
              <div className="ml-auto flex items-center gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="xs"
                >
                  <Link href={`/post/${post.id}/edit`}>
                    <Pencil className="size-3" />
                    Edit
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="size-3" />
                  Delete
                </Button>
              </div>
            ) : null}
          </div>

          <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            <InlineLatex content={post.title} />
          </h1>

          {post.tags && post.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {post.tags.map((tag) => (
                <TagLink key={tag} tag={tag} />
              ))}
            </div>
          ) : null}

          <div className="space-y-5 text-[15px] leading-7 sm:text-[17px] sm:leading-8">
            <MarkdownRenderer content={renderedContent} className="post-detail-prose" />
          </div>

          {post.url && post.section !== "papers" && post.section !== "showcase" && post.section !== "jobs" ? (
            <Card className="bg-accent/30 border-primary/20 py-3">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 px-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">External Link</p>
                  <p className="text-muted-foreground text-xs">Source or reference</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={post.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open link
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {post.type === "paper" && paperMeta ? (
            <Card className="bg-accent/30 border-primary/20 py-3">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 px-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Paper URL</p>
                  <p className="text-muted-foreground text-xs break-all">{paperMeta.label}</p>
                </div>
                {primaryLink ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={primaryLink} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                      Open paper
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {post.type === "showcase" && post.projectUrl ? (
            <Card className="bg-accent/30 border-[var(--section-showcase)]/20 py-3">
              <CardContent className="space-y-2 px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Project</p>
                    {post.showcaseType ? (
                      <p className="text-muted-foreground text-xs">Type: {showcaseTypeLabels[post.showcaseType]}</p>
                    ) : null}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={post.projectUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                      View Project
                    </a>
                  </Button>
                </div>
                {post.techStack && post.techStack.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {post.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-[11px]">{tech}</Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {post.type === "job" ? (
            <Card className="bg-accent/30 border-[var(--section-jobs)]/20 py-3">
              <CardContent className="space-y-2 px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Job Details</p>
                    {post.company ? <p className="text-muted-foreground text-xs">{post.company}</p> : null}
                    {post.location ? <p className="text-muted-foreground text-xs">{post.location}</p> : null}
                    <div className="flex flex-wrap gap-1.5">
                      {post.jobType ? <Badge variant="outline" className="text-[11px]">{jobTypeLabels[post.jobType]}</Badge> : null}
                      {post.deadline ? (
                        isPast(new Date(post.deadline)) ? (
                          <Badge variant="secondary" className="text-[11px] bg-muted text-muted-foreground">Closed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px]">Due: {format(new Date(post.deadline), "MMM d, yyyy")}</Badge>
                        )
                      ) : null}
                    </div>
                    {post.deadline && isPast(new Date(post.deadline)) ? (
                      <p className="text-muted-foreground text-xs italic">This position has closed</p>
                    ) : null}
                  </div>
                  {post.applicationUrl ? (
                    <Button asChild variant="default" size="sm" disabled={Boolean(post.deadline && isPast(new Date(post.deadline)))}>
                      <a href={post.applicationUrl} target="_blank" rel="noreferrer">
                        Apply Now
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="text-muted-foreground flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-sm">
            <VoteButton
              targetType="post"
              targetId={post.id}
              initialCount={post.voteCount}
              initialUserVote={post.userVote ?? 0}
              orientation="horizontal"
              size="sm"
              compact
              countMode="net"
              className="h-8 min-h-11 px-1.5 md:min-h-0"
            />
            <Button variant="ghost" size="sm" className="h-8 min-h-11 px-2.5 md:min-h-0">
              <MessageSquare className="size-4" />
              <span className="sm:hidden">{post.commentCount}</span>
              <span className="hidden sm:inline">{post.commentCount} Comments</span>
            </Button>
            <ShareButton
              postId={post.id}
              className="h-8 min-h-11 px-2.5 md:min-h-0"
              iconClassName="size-4"
            />
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete post"
        description="Delete this post? This cannot be undone."
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </Card>
  )
}
