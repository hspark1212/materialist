"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""

export function PageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.origin + url,
      page_title: document.title,
    })
  }, [pathname, searchParams])

  return null
}
