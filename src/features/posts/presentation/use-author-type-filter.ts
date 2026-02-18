"use client"

import { useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import type { AuthorType } from "../application/ports"

export function useAuthorTypeFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const raw = searchParams.get("authorType")
  // Default to "human", treat legacy "all" as "human"
  const authorType: AuthorType = raw === "bot" ? "bot" : "human"

  const setAuthorType = useCallback(
    (value: AuthorType) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "human") {
        // Clean URL: remove param when default
        params.delete("authorType")
      } else {
        params.set("authorType", value)
      }
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`)
    },
    [searchParams, router, pathname],
  )

  return { authorType, setAuthorType }
}
