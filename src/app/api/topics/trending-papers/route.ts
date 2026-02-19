import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const revalidate = 300

type TrendingPaperRow = {
  id: string
  title: string
  url: string | null
  arxiv_id: string | null
  doi: string | null
  vote_count: number
}

function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

async function fetchArxivTitle(arxivId: string): Promise<string | null> {
  const cleanId = arxivId.trim().replace(/^arxiv:/i, "")
  if (!cleanId) return null

  try {
    const response = await fetch(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(cleanId)}`, {
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!response.ok) return null

    const xml = await response.text()
    const match = xml.match(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/i)
    if (!match?.[1]) return null

    return normalizeTitle(decodeXmlEntities(match[1]))
  } catch {
    return null
  }
}

function extractCrossrefTitle(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null
  const message = (payload as { message?: unknown }).message
  if (typeof message !== "object" || message === null) return null
  const titles = (message as { title?: unknown }).title
  if (!Array.isArray(titles) || titles.length === 0) return null
  const firstTitle = titles[0]
  if (typeof firstTitle !== "string") return null
  return normalizeTitle(firstTitle)
}

function extractDoiCslTitle(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null
  const title = (payload as { title?: unknown }).title
  if (typeof title !== "string") return null
  return normalizeTitle(title)
}

async function fetchDoiTitle(doi: string): Promise<string | null> {
  const cleanDoi = doi.trim()
  if (!cleanDoi) return null

  try {
    const crossref = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    })
    if (crossref.ok) {
      const payload = await crossref.json()
      const title = extractCrossrefTitle(payload)
      if (title) return title
    }
  } catch {
    // Fall through to DOI CSL endpoint.
  }

  try {
    const doiResponse = await fetch(`https://doi.org/${encodeURIComponent(cleanDoi)}`, {
      headers: { Accept: "application/vnd.citationstyles.csl+json" },
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!doiResponse.ok) return null

    const payload = await doiResponse.json()
    return extractDoiCslTitle(payload)
  } catch {
    return null
  }
}

async function resolvePaperTitle(row: TrendingPaperRow): Promise<string> {
  if (row.arxiv_id) {
    const arxivTitle = await fetchArxivTitle(row.arxiv_id)
    if (arxivTitle) return arxivTitle
  }

  if (row.doi) {
    const doiTitle = await fetchDoiTitle(row.doi)
    if (doiTitle) return doiTitle
  }

  return row.title
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") ?? "3", 10)
    const daysBack = parseInt(searchParams.get("days") ?? "7", 10)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, url, arxiv_id, doi, vote_count")
      .eq("section", "papers")
      .gte("created_at", cutoffDate.toISOString())
      .order("vote_count", { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    const rows = (data ?? []) as TrendingPaperRow[]
    const papers = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        title: await resolvePaperTitle(row),
      })),
    )

    return NextResponse.json({ papers })
  } catch (error) {
    console.error("[API] Failed to fetch trending papers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
