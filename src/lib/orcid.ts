export function buildOrcidAuthUrl() {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const redirectUri = encodeURIComponent(`${origin}/api/orcid/callback`)
  return `https://orcid.org/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${redirectUri}`
}
