"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { Notification } from "../domain/types"

const POLL_INTERVAL = 60_000
const NOTIFICATIONS_PANEL_LIMIT = 10

export function useNotifications(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count ?? 0)
      }
    } catch {
      // Silently fail on network errors
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?limit=${NOTIFICATIONS_PANEL_LIMIT}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Polling for unread count
  useEffect(() => {
    if (!enabled) return

    fetchUnreadCount()

    const startPolling = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL)
    }

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        fetchUnreadCount()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [enabled, fetchUnreadCount])

  const openPanel = useCallback(() => {
    setPanelOpen(true)
    fetchNotifications()
  }, [fetchNotifications])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const markAsRead = useCallback(async (ids: string[]) => {
    const prevNotifications = notifications
    const prevCount = unreadCount

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - ids.length))

    try {
      const res = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        setNotifications(prevNotifications)
        setUnreadCount(prevCount)
      }
    } catch {
      setNotifications(prevNotifications)
      setUnreadCount(prevCount)
    }
  }, [notifications, unreadCount])

  const markAllAsRead = useCallback(async () => {
    const prevNotifications = notifications
    const prevCount = unreadCount

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      const res = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) {
        // Revert on failure
        setNotifications(prevNotifications)
        setUnreadCount(prevCount)
      }
    } catch {
      setNotifications(prevNotifications)
      setUnreadCount(prevCount)
    }
  }, [notifications, unreadCount])

  return {
    unreadCount,
    notifications,
    loading,
    panelOpen,
    openPanel,
    closePanel,
    markAsRead,
    markAllAsRead,
  }
}
