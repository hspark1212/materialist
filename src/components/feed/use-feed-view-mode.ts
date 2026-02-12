"use client"

import { useCallback, useState } from "react"

import type { FeedViewMode } from "@/components/feed/feed-controls"

const STORAGE_KEY = "feed-view-mode"

function readStoredMode(fallback: FeedViewMode): FeedViewMode {
  if (typeof window === "undefined") return fallback
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === "card" || stored === "compact" ? stored : fallback
}

export function useFeedViewMode(defaultMode: FeedViewMode = "card") {
  const [viewMode, setStoredViewMode] = useState<FeedViewMode>(() => readStoredMode(defaultMode))

  const setViewMode = useCallback((nextMode: FeedViewMode) => {
    setStoredViewMode(nextMode)
    localStorage.setItem(STORAGE_KEY, nextMode)
  }, [])

  return { viewMode, setViewMode }
}
