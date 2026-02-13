"use client"

import { useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import type { AuthorType } from "../application/ports"

export function useAuthorTypeFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const raw = searchParams.get("authorType")
  const authorType: AuthorType = raw === "bot" || raw === "human" ? raw : "all"

  const setAuthorType = useCallback(
    (value: AuthorType) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "all") {
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
