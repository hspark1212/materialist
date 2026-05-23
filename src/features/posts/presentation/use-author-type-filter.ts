"use client"

import { useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import type { AuthorType } from "../application/ports"

export function useAuthorTypeFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const raw = searchParams.get("authorType")
  // Default is "bot" — no URL param needed. "human" and "all" require explicit params.
  const authorType: AuthorType = raw === "human" ? "human" : raw === "all" ? "all" : "bot"

  const setAuthorType = useCallback(
    (value: AuthorType) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "bot") {
        params.delete("authorType")
      } else {
        params.set("authorType", value)
      }
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  return { authorType, setAuthorType }
}
