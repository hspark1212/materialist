import { NextRequest, NextResponse } from "next/server"

const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER?.trim() || "hspark1212"
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME?.trim() || "materialist"

const MIN_LENGTH = 8
const MAX_LENGTH = 2000

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
  "User-Agent": "materialist-feedback",
}

let labelEnsured = false

async function ensureFeedbackLabel(token: string) {
  if (labelEnsured) return
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/labels`, {
    method: "POST",
    headers: { ...GITHUB_HEADERS, Authorization: `token ${token}` },
    body: JSON.stringify({ name: "feedback", color: "c5def5", description: "User feedback from the site" }),
  })
  // 201 = created, 422 = already exists — both are fine; other statuses allow retry
  if (res.status === 201 || res.status === 422) {
    labelEnsured = true
  }
}

export function validateFeedbackBody(body: unknown): { error: string } | { content: string; website?: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Invalid JSON" }
  }
  const { content, website } = body as { content?: string; website?: string }
  if (typeof content !== "string" || content.trim().length < MIN_LENGTH) {
    return { error: `Feedback must be at least ${MIN_LENGTH} characters.` }
  }
  if (content.length > MAX_LENGTH) {
    return { error: `Feedback must be at most ${MAX_LENGTH} characters.` }
  }
  return { content: content.trim(), website }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const validated = validateFeedbackBody(body)
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  // Honeypot: if filled, silently succeed without creating an issue
  if (validated.website) {
    return NextResponse.json({ success: true })
  }

  const trimmed = validated.content
  const firstLine = trimmed.split("\n")[0].slice(0, 80)
  const title = `[Feedback] ${firstLine}`

  const token = process.env.GITHUB_TOKEN?.trim()
  if (!token) {
    console.error("Feedback API: GITHUB_TOKEN is not set")
    return NextResponse.json({ error: "Feedback service is temporarily unavailable." }, { status: 503 })
  }

  try {
    await ensureFeedbackLabel(token)

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`, {
      method: "POST",
      headers: { ...GITHUB_HEADERS, Authorization: `token ${token}` },
      body: JSON.stringify({
        title,
        body: trimmed,
        labels: ["feedback"],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Feedback API: GitHub issue creation failed", {
        status: response.status,
        body: errorText.slice(0, 500),
      })
      return NextResponse.json({ error: "Failed to submit feedback. Please try again." }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback API: unexpected error", error)
    return NextResponse.json({ error: "Failed to submit feedback. Please try again." }, { status: 500 })
  }
}
