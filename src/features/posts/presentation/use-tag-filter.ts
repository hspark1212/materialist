"use client"

import { useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export function useTagFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTag = searchParams.get("tag") ?? undefined

  const clearTag = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("tag")
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`)
  }, [searchParams, router, pathname])

  return { activeTag, clearTag }
}
