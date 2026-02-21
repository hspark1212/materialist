export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""

// https://developers.google.com/analytics/devguides/collection/ga4/page-view
export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return
  try {
    if (typeof window.gtag === "function") window.gtag("config", GA_MEASUREMENT_ID, { page_path: url })
  } catch {}
}

// https://developers.google.com/analytics/devguides/collection/ga4/event-parameters
export function event(action: string, params?: Record<string, string | number | boolean>) {
  if (!GA_MEASUREMENT_ID) return
  try {
    if (typeof window.gtag === "function") window.gtag("event", action, params)
  } catch {}
}

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set" | "consent",
      targetOrAction: string | Date,
      params?: Record<string, unknown>,
    ) => void
    dataLayer: Record<string, unknown>[]
  }
}
