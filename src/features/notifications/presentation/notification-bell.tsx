"use client"

import { Bell } from "lucide-react"

import { cn } from "@/lib"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotifications } from "./use-notifications"
import { NotificationPanel } from "./notification-panel"

type NotificationBellProps = {
  enabled: boolean
}

export function NotificationBell({ enabled }: NotificationBellProps) {
  const { unreadCount, notifications, loading, panelOpen, openPanel, closePanel, markAsRead, markAllAsRead } =
    useNotifications(enabled)

  return (
    <Popover
      open={panelOpen}
      onOpenChange={(open) => {
        if (open) openPanel()
        else closePanel()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative min-h-11 min-w-11 rounded-full md:min-h-9 md:min-w-9", panelOpen && "bg-accent")}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <Bell className="size-[21px] md:size-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-[18px] font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="border-border/80 w-auto overflow-hidden rounded-xl border p-0 shadow-lg"
        sideOffset={8}
      >
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      </PopoverContent>
    </Popover>
  )
}
