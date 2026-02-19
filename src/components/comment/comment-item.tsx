"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { formatDistanceToNow } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { Comment } from "@/lib"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AuthorName } from "@/components/user/author-name"
import { UserAvatar } from "@/components/user/user-avatar"
import { VoteButton } from "@/components/voting/vote-button"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { CommentComposer } from "@/components/comment/comment-composer"

type CommentItemProps = {
  comment: Comment
  children?: ReactNode
  onChanged?: () => void | Promise<void>
}

const depthColors = ["#58a6ff", "#3fb950", "#f0883e", "#bc8cff", "#ff7b72", "#79c0ff"]
const MAX_DEPTH = 6

export function CommentItem({ comment, children, onChanged }: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(comment.isCollapsed)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
  const isEdited = new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000
  const depthColor = depthColors[comment.depth % depthColors.length]
  const replyComposerRef = useRef<HTMLDivElement>(null)

  const isOwnComment = Boolean(comment.isOwner)
  const canReply = comment.depth < MAX_DEPTH
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!isReplying) return
    replyComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [isReplying])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(payload.error ?? "Failed to delete comment")
        return
      }

      if (onChanged) {
        await onChanged()
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return
    setIsSavingEdit(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(payload.error ?? "Failed to update comment")
        return
      }

      setIsEditing(false)
      if (onChanged) await onChanged()
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div
      className="border-l-2 pl-2 sm:pl-4"
      style={{
        borderLeftColor: depthColor,
      }}
    >
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <div className="space-y-2 py-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="hover:bg-accent/40 flex w-full items-center gap-2 rounded-md px-1 py-1 min-h-11 md:min-h-0 text-left"
            >
              <UserAvatar user={comment.author} size="sm" />
              <AuthorName user={comment.author} className="text-sm" />
              <span className="text-muted-foreground text-xs">{timeAgo}</span>
              {isEdited ? <span className="text-muted-foreground text-xs italic">(edited)</span> : null}
              <span className="text-muted-foreground ml-auto text-xs">{isCollapsed ? "[+]" : "[-]"}</span>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] resize-y text-sm"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!editContent.trim() || isSavingEdit}
                    onClick={handleSaveEdit}
                  >
                    {isSavingEdit ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSavingEdit}
                    onClick={() => {
                      setEditContent(comment.content)
                      setIsEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <MarkdownRenderer content={comment.content} compact className="text-sm" />
            )}

            <div className="flex items-center gap-1">
              <VoteButton targetType="comment" targetId={comment.id} initialCount={comment.voteCount} orientation="horizontal" size="sm" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 min-h-11 px-2 text-xs md:min-h-0"
                disabled={!canReply}
                onClick={() => setIsReplying((current) => !current)}
                title={!canReply ? "Maximum reply depth reached" : undefined}
              >
                {isReplying ? "Cancel" : "Reply"}
              </Button>
              {isOwnComment ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 min-h-11 px-2 text-xs md:min-h-0"
                    onClick={() => {
                      setEditContent(comment.content)
                      setIsEditing(true)
                    }}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-7 min-h-11 px-2 text-xs text-destructive hover:text-destructive md:min-h-0"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </>
              ) : null}
            </div>

            {isReplying ? (
              <div ref={replyComposerRef} className="pt-2">
                <CommentComposer
                  postId={comment.postId}
                  parentCommentId={comment.id}
                  autoFocus
                  onSubmitted={async () => {
                    setIsReplying(false)
                    if (onChanged) await onChanged()
                  }}
                />
              </div>
            ) : null}

            {children ? <div className="space-y-1">{children}</div> : null}
          </CollapsibleContent>
        </div>
      </Collapsible>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete comment"
        description="Delete this comment? This cannot be undone."
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
