export function buildOrcidAuthUrl() {
  if (typeof window === "undefined") return "#"
  const origin = window.location.origin
  const redirectUri = encodeURIComponent(`${origin}/api/orcid/callback`)
  const state =
    crypto.randomUUID?.() ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("")
  document.cookie = `orcid_state=${state}; path=/api/orcid/callback; max-age=600; samesite=lax; secure`
  return `https://orcid.org/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${redirectUri}&state=${state}`
}
