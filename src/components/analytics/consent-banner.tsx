"use client"

import Link from "next/link"

import { useAnalyticsConsent } from "@/lib/analytics"
import { Button } from "@/components/ui/button"

export function ConsentBanner() {
  const { showBanner, acceptAll, rejectAll } = useAnalyticsConsent()

  if (!showBanner) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-card p-4 shadow-lg md:inset-x-auto md:bottom-4 md:right-4 md:max-w-md md:rounded-lg md:border">
      <p className="text-sm text-muted-foreground">
        We use cookies for analytics to improve your experience.{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={rejectAll}>
          Reject
        </Button>
        <Button size="sm" onClick={acceptAll}>
          Accept
        </Button>
      </div>
    </div>
  )
}
