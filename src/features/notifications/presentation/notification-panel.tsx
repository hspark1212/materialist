"use client"

import { Bell, CheckCheck } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { NotificationItem } from "./notification-item"
import type { Notification } from "../domain/types"

type NotificationPanelProps = {
  notifications: Notification[]
  loading: boolean
  onMarkAsRead: (ids: string[]) => void
  onMarkAllAsRead: () => void
}

function PanelHeader({
  hasUnread,
  onMarkAllAsRead,
}: {
  hasUnread: boolean
  onMarkAllAsRead: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Notifications</h3>
      </div>
      {hasUnread && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={onMarkAllAsRead}
        >
          <CheckCheck className="size-3.5" />
          Mark all read
        </Button>
      )}
    </div>
  )
}

export function NotificationPanel({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationPanelProps) {
  const hasUnread = notifications.some((n) => !n.isRead)

  if (loading) {
    return (
      <div className="w-[min(400px,calc(100vw-2rem))]">
        <PanelHeader hasUnread={false} onMarkAllAsRead={onMarkAllAsRead} />
        <div className="border-t border-border">
          <div className="space-y-0 divide-y divide-border/50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="size-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="w-[min(400px,calc(100vw-2rem))]">
        <PanelHeader hasUnread={false} onMarkAllAsRead={onMarkAllAsRead} />
        <div className="border-t border-border">
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
            <div className="rounded-full bg-muted p-3">
              <Bell className="size-6" />
            </div>
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs">We&apos;ll notify you when something happens</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[min(400px,calc(100vw-2rem))]">
      <PanelHeader hasUnread={hasUnread} onMarkAllAsRead={onMarkAllAsRead} />
      <div className="border-t border-border">
        <ScrollArea type="always" className="h-[min(420px,calc(100dvh-11rem))]">
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={(id) => onMarkAsRead([id])}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
