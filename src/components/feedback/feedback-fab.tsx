"use client"

import { useCallback, useRef, useState } from "react"
import { MessageSquarePlus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const MIN_LENGTH = 8
const MAX_LENGTH = 2000
const COOLDOWN_MS = 30_000

export function FeedbackFab() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const cooldownUntil = useRef(0)
  const honeypotRef = useRef<HTMLInputElement>(null)

  const trimmedLength = content.trim().length
  const canSubmit = trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH && !submitting

  const handleSubmit = useCallback(async () => {
    if (Date.now() < cooldownUntil.current) {
      toast.error("Please wait before submitting another feedback.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), website: honeypotRef.current?.value }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to submit feedback.")
      }

      toast.success("Thank you for your feedback!")
      cooldownUntil.current = Date.now() + COOLDOWN_MS
      setContent("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback.")
    } finally {
      setSubmitting(false)
    }
  }, [content])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className={cn(
          "fixed right-6 z-40 flex size-12 items-center justify-center rounded-full shadow-lg transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "bottom-6 md:bottom-6",
          "max-md:bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px)+0.75rem)]",
        )}
      >
        <MessageSquarePlus className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>Report a bug or suggest an improvement. Your feedback will be reviewed.</DialogDescription>
          </DialogHeader>

          {/* Honeypot field — hidden from real users */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="feedback-website">Website</label>
            <input ref={honeypotRef} id="feedback-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="What's on your mind? (min 8 characters)"
              rows={5}
              className="resize-none"
              disabled={submitting}
            />
            <p className="text-muted-foreground text-right text-xs tabular-nums">
              {trimmedLength} / {MAX_LENGTH}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
