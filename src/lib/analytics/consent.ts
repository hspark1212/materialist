import type { ConsentState } from "./types"

const STORAGE_KEY = "materialist_consent"

export function initConsentDefaults(): void {
  if (typeof window === "undefined") return

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })
}

export function hasRespondedToConsent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function getConsentState(): ConsentState {
  if (typeof window === "undefined") return { analytics: false }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as ConsentState
  } catch {
    // corrupted data
  }
  return { analytics: false }
}

export function updateConsent(consent: ConsentState): void {
  if (typeof window === "undefined") return

  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))

  if (window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    })
  }
}
