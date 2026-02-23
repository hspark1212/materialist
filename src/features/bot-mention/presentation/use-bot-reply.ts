"use client"

import { useCallback, useState } from "react"

import { toast } from "sonner"
import { event } from "@/lib/analytics/gtag"
import { parseMentionBot } from "../domain/mention-parser"

type UseBotReplyResult = {
  isBotReplying: boolean
  triggerBotReply: (commentContent: string, commentId: string) => void
}

export function useBotReply(postId: string, onBotReplied?: (() => void | Promise<void>)): UseBotReplyResult {
  const [isBotReplying, setIsBotReplying] = useState(false)

  const triggerBotReply = useCallback(
    (commentContent: string, commentId: string) => {
      if (!parseMentionBot(commentContent).found) return

      event("bot_mention", { post_id: postId })

      setIsBotReplying(true)

      fetch("/api/bot/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, commentId }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json()
            if (res.status === 429) {
              toast.info("Please wait before mentioning the bot again.")
            } else {
              toast.error(data.error ?? "Bot reply failed")
            }
            return
          }

          event("bot_reply_received", { post_id: postId })

          if (onBotReplied) {
            await onBotReplied()
          }
        })
        .catch(() => {
          toast.error("Failed to get bot reply")
        })
        .finally(() => {
          setIsBotReplying(false)
        })
    },
    [postId, onBotReplied],
  )

  return { isBotReplying, triggerBotReply }
}
