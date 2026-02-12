"use client"

import { useCallback, useState, useSyncExternalStore } from "react"

import type { FeedViewMode } from "@/components/feed/feed-controls"

const MOBILE_VIEWPORT_QUERY = "(max-width: 767px)"

function getMobileSnapshot() {
  if (typeof window === "undefined") return false
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches
}

function subscribeToMobileViewport(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const mediaQueryList = window.matchMedia(MOBILE_VIEWPORT_QUERY)
  mediaQueryList.addEventListener("change", onStoreChange)
  return () => mediaQueryList.removeEventListener("change", onStoreChange)
}

export function useFeedViewMode(defaultMode: FeedViewMode = "card") {
  const isMobile = useSyncExternalStore(subscribeToMobileViewport, getMobileSnapshot, () => false)
  const [rawViewMode, setRawViewMode] = useState<FeedViewMode>(defaultMode)
  const [isOverridden, setIsOverridden] = useState(false)

  const setViewMode = useCallback((nextMode: FeedViewMode) => {
    setIsOverridden(true)
    setRawViewMode(nextMode)
  }, [])

  const viewMode = !isOverridden && isMobile ? "compact" : rawViewMode

  return { viewMode, setViewMode }
}
