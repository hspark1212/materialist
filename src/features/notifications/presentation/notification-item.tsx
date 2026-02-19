"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Reply } from "lucide-react"

import { cn } from "@/lib"
import { AnonymousAvatar } from "@/components/user/anonymous-avatar"
import type { Notification } from "../domain/types"

type NotificationItemProps = {
  notification: Notification
  onRead: (id: string) => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
  const isReply = notification.type === "reply_to_comment"
  const Icon = isReply ? Reply : MessageSquare
  const actionText = isReply ? "replied to your comment on" : "commented on"

  return (
    <Link
      href={`/post/${notification.postId}`}
      onClick={() => {
        if (!notification.isRead) onRead(notification.id)
      }}
      className={cn(
        "group hover:bg-accent/50 flex items-start gap-3 px-4 py-3 transition-colors",
        !notification.isRead && "bg-primary/[0.04]",
      )}
    >
      {/* Unread indicator + Avatar */}
      <div className="relative mt-0.5 shrink-0">
        {!notification.isRead && (
          <div className="bg-primary absolute top-1/2 -left-2.5 size-1.5 -translate-y-1/2 rounded-full" />
        )}
        <div className="ring-border/50 overflow-hidden rounded-full ring-2">
          <AnonymousAvatar
            seed={notification.actorIsAnonymous ? "anonymous" : notification.actorDisplayName}
            size={36}
          />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[13px] leading-relaxed">
          <span className={cn("font-semibold", !notification.isRead && "text-foreground")}>
            {notification.actorDisplayName}
          </span>{" "}
          <span className="text-muted-foreground">{actionText}</span>{" "}
          <span className={cn("font-semibold", !notification.isRead && "text-foreground")}>
            {notification.postTitle}
          </span>
        </p>

        {notification.commentSnippet && (
          <div className="border-border/60 bg-muted/40 rounded-md border px-2.5 py-1.5">
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              &ldquo;{notification.commentSnippet}&rdquo;
            </p>
          </div>
        )}

        <div className="text-muted-foreground/70 flex items-center gap-1.5 text-[11px]">
          <Icon className="size-3" />
          <span suppressHydrationWarning>{timeAgo}</span>
        </div>
      </div>
    </Link>
  )
}
