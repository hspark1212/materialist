"use client"

import { useCallback, useSyncExternalStore } from "react"

import type { FeedViewMode } from "@/components/feed/feed-controls"

const STORAGE_KEY = "feed-view-mode"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function getSnapshot(): FeedViewMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === "card" || stored === "compact" ? stored : "card"
}

export function useFeedViewMode(defaultMode: FeedViewMode = "card") {
  const viewMode = useSyncExternalStore(subscribe, getSnapshot, () => defaultMode)

  const setViewMode = useCallback((nextMode: FeedViewMode) => {
    localStorage.setItem(STORAGE_KEY, nextMode)
    // Trigger storage event for useSyncExternalStore to pick up
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
  }, [])

  return { viewMode, setViewMode }
}
