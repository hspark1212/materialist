"use client"

import { useCallback, useState } from "react"

import type { FeedViewMode } from "@/components/feed/feed-controls"

export function useFeedViewMode(defaultMode: FeedViewMode = "card") {
  const [viewMode, setStoredViewMode] = useState<FeedViewMode>(defaultMode)

  const setViewMode = useCallback((nextMode: FeedViewMode) => {
    setStoredViewMode(nextMode)
  }, [])

  return { viewMode, setViewMode }
}
