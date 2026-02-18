"use client"

import { useCallback, useEffect, useState } from "react"

import type { FeedViewMode } from "@/components/feed/feed-controls"

const STORAGE_KEY = "feed-view-mode"

export function useFeedViewMode(defaultMode: FeedViewMode = "card") {
  // Start with default to match SSR, then sync with localStorage after hydration
  const [viewMode, setStoredViewMode] = useState<FeedViewMode>(defaultMode)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "card" || stored === "compact") {
      setStoredViewMode(stored)
    }
  }, [])

  const setViewMode = useCallback((nextMode: FeedViewMode) => {
    setStoredViewMode(nextMode)
    localStorage.setItem(STORAGE_KEY, nextMode)
  }, [])

  return { viewMode, setViewMode }
}
