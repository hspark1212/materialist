"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { normalizeSearchQuery } from "../domain/query-normalization"

const FEED_PATHS = new Set(["/", "/papers", "/forum", "/showcase", "/jobs"])

function resolveTargetPath(pathname: string): string {
  return FEED_PATHS.has(pathname) ? pathname : "/"
}

export function useSearchFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeQuery = normalizeSearchQuery(searchParams.get("q"))

  const submitSearch = useCallback((value: string) => {
    const targetPath = resolveTargetPath(pathname)
    const params = FEED_PATHS.has(pathname)
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams()

    const nextQuery = normalizeSearchQuery(value)
    if (nextQuery) {
      params.set("q", nextQuery)
    } else {
      params.delete("q")
    }

    const qs = params.toString()
    router.push(`${targetPath}${qs ? `?${qs}` : ""}`)
  }, [pathname, router, searchParams])

  const clearQuery = useCallback(() => {
    const targetPath = resolveTargetPath(pathname)
    const params = FEED_PATHS.has(pathname)
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams()

    params.delete("q")
    const qs = params.toString()
    router.push(`${targetPath}${qs ? `?${qs}` : ""}`)
  }, [pathname, router, searchParams])

  return {
    activeQuery,
    submitSearch,
    clearQuery,
  }
}
