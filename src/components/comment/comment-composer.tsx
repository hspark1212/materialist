"use client"

import { useId, useRef, useState } from "react"

import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { resolveAuthorIdentity } from "@/features/posts/domain/mappers"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { MarkdownToolbar } from "@/components/editor/markdown-toolbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type CommentComposerProps = {
  postId: string
  parentCommentId?: string | null
  onSubmitted?: () => void | Promise<void>
  autoFocus?: boolean
}

export function CommentComposer({ postId, parentCommentId = null, onSubmitted, autoFocus = false }: CommentComposerProps) {
  const anonToggleId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { status, user } = useAuth()
  const [content, setContent] = useState("")
  const isOrcidLinked = Boolean(user?.orcidId)
  const [isAnonymous, setIsAnonymous] = useState(!isOrcidLinked)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayUser = user ? resolveAuthorIdentity(user, isAnonymous) : null
  const displayName = displayUser?.displayName ?? "Anonymous"

  const handleSubmit = async () => {
    if (!content.trim()) return

    if (status === "anonymous") {
      toast.info("Sign in to comment.")
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
          isAnonymous,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create comment")
      }

      setContent("")

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
          <TabsList className="grid w-full grid-cols-2 bg-muted/40 p-1">
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
              className="min-h-24 resize-y rounded-lg border border-border/80 bg-background/70 font-mono shadow-sm transition-[border-color,box-shadow,background-color] hover:bg-background focus-visible:border-ring focus-visible:bg-background"
            />
            <p className="text-muted-foreground text-xs">Markdown & LaTeX supported</p>
          </TabsContent>

          <TabsContent value="preview" className="min-h-24 rounded-md border border-border/80 bg-background/70 px-3 py-2 text-sm shadow-sm dark:bg-background/50">
            {content.trim() ? (
              <MarkdownRenderer content={content} compact />
            ) : (
              <p className="text-muted-foreground">Nothing to preview yet.</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              size="sm"
              id={anonToggleId}
              disabled={!isOrcidLinked}
            />
            <label htmlFor={anonToggleId} className="text-muted-foreground text-xs sm:text-sm">
              Post anonymously
            </label>
          </div>

          <Button size="sm" disabled={!content.trim() || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Commenting..." : "Comment"}
          </Button>
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}

        <p className="text-muted-foreground text-xs">
          Posting as {displayName}
          {!isOrcidLinked ? (
            <span className="text-muted-foreground/60"> — Link your ORCID to post under your real name</span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  )
}
