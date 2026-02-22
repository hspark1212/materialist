"use client"

import { useRef, useState } from "react"

import { toast } from "sonner"
import { event } from "@/lib/analytics/gtag"
import { useAuth } from "@/lib/auth"
import { useIdentity } from "@/lib/identity"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { MarkdownToolbar } from "@/components/editor/markdown-toolbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type CommentComposerProps = {
  postId: string
  parentCommentId?: string | null
  onSubmitted?: () => void | Promise<void>
  autoFocus?: boolean
}

export function CommentComposer({
  postId,
  parentCommentId = null,
  onSubmitted,
  autoFocus = false,
}: CommentComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { status } = useAuth()
  const { activeUser, isAnonymousMode } = useIdentity()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayName = activeUser?.displayName ?? "Anonymous"

  const handleSubmit = async () => {
    if (!content.trim()) return

    if (status === "anonymous") {
      toast.info("Sign in to comment.", {
        action: {
          label: "Sign in",
          onClick: () => (window.location.href = "/login"),
        },
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          parentCommentId,
          isAnonymous: isAnonymousMode,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create comment")
      }

      setContent("")
      event("comment_created", { post_id: postId, is_reply: Boolean(parentCommentId) })

      if (onSubmitted) {
        await onSubmitted()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-card/80 py-3" data-testid="comment-composer">
      <CardContent className="space-y-3 px-4">
        <Tabs defaultValue="write" className="w-full">
          <TabsList className="bg-muted/40 grid w-full grid-cols-2 p-1">
            <TabsTrigger
              value="write"
              className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Write
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="space-y-2">
            <MarkdownToolbar textareaRef={textareaRef} value={content} onValueChange={setContent} variant="compact" />
            <Textarea
              ref={textareaRef}
              autoFocus={autoFocus}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Add your perspective to the discussion"
              className="border-border/80 bg-background/70 hover:bg-background focus-visible:border-ring focus-visible:bg-background min-h-24 resize-y rounded-lg border font-mono shadow-sm transition-[border-color,box-shadow,background-color]"
            />
            <p className="text-muted-foreground text-xs">Markdown & LaTeX supported</p>
          </TabsContent>

          <TabsContent
            value="preview"
            className="border-border/80 bg-background/70 dark:bg-background/50 min-h-24 rounded-md border px-3 py-2 text-sm shadow-sm"
          >
            {content.trim() ? (
              <MarkdownRenderer content={content} compact />
            ) : (
              <p className="text-muted-foreground">Nothing to preview yet.</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Posting as <span className="text-foreground font-medium">{displayName}</span>
            {isAnonymousMode ? " · anonymous mode" : null}
          </p>

          <Button size="sm" disabled={!content.trim() || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Commenting..." : "Comment"}
          </Button>
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
