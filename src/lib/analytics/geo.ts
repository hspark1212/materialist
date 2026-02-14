/**
 * GDPR-region detection for cookie consent.
 * EU 27 + EEA (IS, LI, NO) + UK + Switzerland = 32 countries.
 * Uses ISO 3166-1 alpha-2 codes matching Cloudflare's CF-IPCountry header.
 */

const GDPR_COUNTRIES = new Set([
  // EU 27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA (non-EU)
  "IS", "LI", "NO",
  // UK + Switzerland
  "GB", "CH",
])

export function isGdprCountry(countryCode: string | null): boolean {
  if (!countryCode) return true // Unknown → show banner (safe default)
  return GDPR_COUNTRIES.has(countryCode.toUpperCase())
}
