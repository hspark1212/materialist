"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import type { CommentSort } from "@/features/posts/domain/types"
import { usePostDetail } from "@/features/posts/presentation/use-post-detail"
import { getSectionLabel, getSectionHref } from "@/lib/sections"
import { Button } from "@/components/ui/button"
import { CommentComposer } from "@/components/comment/comment-composer"
import { CommentThread } from "@/components/comment/comment-thread"
import { PostDetail } from "@/components/post/post-detail"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [commentSort, setCommentSort] = useState<CommentSort>("best")
  const { post, comments, loading, error, refresh } = usePostDetail(params.id, commentSort)

  const refreshWithSidebar = useCallback(async () => {
    await refresh()
    router.refresh()
  }, [refresh, router])

  if (!post && loading) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <p className="text-muted-foreground text-sm">Loading post...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <p className="text-lg font-semibold">Post not found</p>
        {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon-sm" className="min-h-11 min-w-11 shrink-0 md:hidden">
          <Link href="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="text-muted-foreground flex min-w-0 items-center gap-1 overflow-x-auto text-xs sm:text-sm">
          <Link href="/" className="hidden md:inline hover:text-primary">
            Home
          </Link>
          <ChevronRight className="hidden md:inline size-3.5 shrink-0" />
          <Link href={getSectionHref(post.section)} className="hover:text-primary">
            {getSectionLabel(post.section)}
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="truncate text-foreground">{post.title}</span>
        </div>
      </div>

      <PostDetail post={post} />

      <Separator />

      <CommentComposer postId={post.id} onSubmitted={refreshWithSidebar} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold sm:text-base">Comments</h2>
        <ToggleGroup
          type="single"
          value={commentSort}
          onValueChange={(value) => {
            if (value) {
              setCommentSort(value as CommentSort)
            }
          }}
          variant="outline"
          size="sm"
          spacing={1}
        >
          <ToggleGroupItem value="best">Best</ToggleGroupItem>
          <ToggleGroupItem value="new">New</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {loading ? <p className="text-muted-foreground text-sm">Loading comments...</p> : null}
      <CommentThread comments={comments} onChanged={refreshWithSidebar} />
    </div>
  )
}
