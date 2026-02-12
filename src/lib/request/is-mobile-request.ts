import { headers } from "next/headers"

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i

export async function isMobileRequest() {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent") ?? ""
  return MOBILE_USER_AGENT_PATTERN.test(userAgent)
}
