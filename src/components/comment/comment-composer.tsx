"use client"

import { useRef, useState } from "react"

import { toast } from "sonner"
import { getBotForSection } from "@/lib/bots"
import type { Section } from "@/lib/types"
import { event } from "@/lib/analytics/gtag"
import { trackActivation } from "@/lib/analytics/activation"
import { useAuth } from "@/lib/auth"
import { useIdentity } from "@/lib/identity"
import { parseMentionBot } from "@/features/bot-mention/domain/mention-parser"
import { useMentionAutocomplete } from "@/features/bot-mention/presentation/use-mention-autocomplete"
import { useBotReply } from "@/features/bot-mention/presentation/use-bot-reply"
import { MentionDropdown } from "@/features/bot-mention/presentation/mention-dropdown"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { MarkdownToolbar } from "@/components/editor/markdown-toolbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type CommentComposerProps = {
  postId: string
  section: Section
  parentCommentId?: string | null
  onSubmitted?: () => void | Promise<void>
  autoFocus?: boolean
  isFirstComment?: boolean
}

export function CommentComposer({
  postId,
  section,
  parentCommentId = null,
  onSubmitted,
  autoFocus = false,
  isFirstComment = false,
}: CommentComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { status } = useAuth()
  const { activeUser, isAnonymousMode } = useIdentity()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState(0)

  const bot = getBotForSection(section)
  const { showDropdown, insertMention } = useMentionAutocomplete(content, cursorPosition, bot.username)
  const { isBotReplying, triggerBotReply } = useBotReply(postId, onSubmitted)

  const displayName = activeUser?.displayName ?? "Anonymous"

  const updateCursorPosition = () => {
    const textarea = textareaRef.current
    if (textarea) {
      setCursorPosition(textarea.selectionStart)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown) {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertMention(textareaRef, setContent)
      } else if (e.key === "Escape") {
        e.preventDefault()
        // Close dropdown by moving cursor (the autocomplete will recalculate)
        setCursorPosition(-1)
        requestAnimationFrame(updateCursorPosition)
      }
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    if (status === "anonymous") {
      event("auth_gate_shown", { trigger: "comment" })
      toast.info("Sign in to comment.", {
        action: {
          label: "Sign in",
          onClick: () => {
            event("auth_gate_click", { action: "sign_in" })
            window.location.href = "/login"
          },
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

      const submittedContent = content
      setContent("")
      event("comment_created", { post_id: postId, is_reply: Boolean(parentCommentId) })
      trackActivation("comment")

      // Trigger bot reply if mention detected (fire-and-forget, comment already saved)
      // When bot reply is triggered, onSubmitted is called by useBotReply after the reply arrives
      const commentId = payload.comment?.id as string | undefined
      const hasMention = parseMentionBot(submittedContent).found
      if (commentId && hasMention) {
        triggerBotReply(submittedContent, commentId)
      } else if (onSubmitted) {
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
            <div className="relative">
              <Textarea
                ref={textareaRef}
                autoFocus={autoFocus}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setCursorPosition(e.target.selectionStart)
                }}
                onSelect={updateCursorPosition}
                onKeyDown={handleKeyDown}
                placeholder={isFirstComment ? "Be the first to share your thoughts..." : "Add your perspective to the discussion"}
                className="border-border/80 bg-background/70 hover:bg-background focus-visible:border-ring focus-visible:bg-background min-h-24 resize-y rounded-lg border font-mono shadow-sm transition-[border-color,box-shadow,background-color]"
              />
              {showDropdown ? (
                <MentionDropdown
                  botUsername={bot.username}
                  botColor={bot.color}
                  botLabel={bot.shortLabel}
                  onSelect={() => insertMention(textareaRef, setContent)}
                  textareaRef={textareaRef}
                  cursorPosition={cursorPosition}
                />
              ) : null}
            </div>
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

        {isBotReplying ? (
          <p role="status" aria-live="polite" className="text-muted-foreground flex items-center gap-2 text-xs">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {bot.displayName} is thinking...
          </p>
        ) : null}

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
