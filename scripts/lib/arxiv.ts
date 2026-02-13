import type { ArxivPaper, ArxivSearchConfig } from "./types"

// ── XML helpers (adapted from src/app/api/topics/trending-papers/route.ts) ──

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function extractEntries(xml: string): string[] {
  const entries: string[] = []
  const re = /<entry>([\s\S]*?)<\/entry>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    entries.push(m[1])
  }
  return entries
}

function extractTag(entry: string, tag: string): string {
  const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return m ? normalizeWhitespace(decodeXmlEntities(m[1])) : ""
}

function extractAuthors(entry: string): string[] {
  const authors: string[] = []
  const re = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(entry)) !== null) {
    authors.push(normalizeWhitespace(decodeXmlEntities(m[1])))
  }
  return authors
}

function extractCategories(entry: string): string[] {
  const cats: string[] = []
  const re = /<category[^>]*term="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(entry)) !== null) {
    cats.push(m[1])
  }
  return cats
}

function extractArxivId(entry: string): string {
  const idTag = extractTag(entry, "id")
  // id looks like http://arxiv.org/abs/2602.12345v1
  const m = idTag.match(/abs\/(.+?)(?:v\d+)?$/)
  return m ? m[1] : idTag
}

function extractLinks(entry: string): { absUrl: string; pdfUrl: string } {
  const absMatch = entry.match(
    /<link[^>]*rel="alternate"[^>]*href="([^"]+)"/
  )
  const pdfMatch = entry.match(
    /<link[^>]*title="pdf"[^>]*href="([^"]+)"/
  )
  const absUrl = absMatch?.[1] ?? ""
  const pdfUrl = pdfMatch?.[1] ?? ""
  return { absUrl, pdfUrl }
}

function parseEntry(entry: string): ArxivPaper {
  const id = extractArxivId(entry)
  const { absUrl, pdfUrl } = extractLinks(entry)
  return {
    id,
    title: extractTag(entry, "title"),
    abstract: extractTag(entry, "summary"),
    authors: extractAuthors(entry),
    categories: extractCategories(entry),
    published: extractTag(entry, "published"),
    absUrl: absUrl || `https://arxiv.org/abs/${id}`,
    pdfUrl: pdfUrl || `https://arxiv.org/pdf/${id}`,
  }
}

// ── Search queries ──

const QUERY_MATERIALS_TO_AI = [
  "(cat:cond-mat.mtrl-sci OR cat:cond-mat.mes-hall OR cat:physics.comp-ph)",
  'AND (abs:"machine learning" OR abs:"deep learning" OR abs:"neural network"',
  'OR abs:"graph neural" OR abs:"generative model" OR abs:"foundation model"',
  'OR abs:"language model")',
].join(" ")

const QUERY_AI_TO_MATERIALS = [
  "(cat:cs.LG OR cat:cs.AI)",
  'AND (abs:"materials science" OR abs:"materials discovery"',
  'OR abs:"crystal structure" OR abs:"molecular dynamics"',
  'OR abs:"density functional" OR abs:"electronic structure"',
  'OR abs:"alloy" OR abs:"polymer" OR abs:"catalysis")',
].join(" ")

export const DEFAULT_CONFIG: ArxivSearchConfig = {
  queries: [QUERY_MATERIALS_TO_AI, QUERY_AI_TO_MATERIALS],
  maxResultsPerQuery: 25,
  sortBy: "submittedDate",
  sortOrder: "descending",
}

export const QUERY_LABELS = ["Materials→AI", "AI→Materials"]

// ── API fetching ──

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchWithRetry(
  url: string,
  retries = 4,
  baseDelayMs = 30000
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.text()
    if (attempt < retries) {
      const wait = baseDelayMs * (attempt + 1)
      console.warn(
        `  ⚠ arXiv returned ${res.status}, retrying in ${wait / 1000}s... (${attempt + 1}/${retries})`
      )
      await sleep(wait)
    } else {
      throw new Error(`arXiv API failed with status ${res.status} after ${retries + 1} attempts`)
    }
  }
  // The for-loop always returns or throws, but TypeScript can't prove it
  throw new Error("unreachable: retries exhausted")
}

export async function searchArxiv(
  config: ArxivSearchConfig = DEFAULT_CONFIG
): Promise<{ papers: ArxivPaper[]; querySummary: Record<string, number> }> {
  const allPapers: ArxivPaper[] = []
  const querySummary: Record<string, number> = {}

  // Build date filter suffix if dateRange is provided
  const dateFilter = config.dateRange
    ? ` AND submittedDate:[${config.dateRange.from} TO ${config.dateRange.to}]`
    : ""

  if (config.dateRange) {
    console.log(`  Date filter: ${config.dateRange.from} → ${config.dateRange.to}`)
  }

  for (let i = 0; i < config.queries.length; i++) {
    const query = config.queries[i]
    const label = QUERY_LABELS[i] ?? `Query ${i + 1}`

    if (i > 0) {
      console.log("  Waiting 15s (rate limit)...")
      await sleep(15000)
    }

    console.log(`  [${label}] Fetching up to ${config.maxResultsPerQuery} papers...`)

    const fullQuery = query + dateFilter
    const params = new URLSearchParams({
      search_query: fullQuery,
      start: "0",
      max_results: String(config.maxResultsPerQuery),
      sortBy: config.sortBy,
      sortOrder: config.sortOrder,
    })

    const url = `https://export.arxiv.org/api/query?${params.toString()}`

    const xml = await fetchWithRetry(url)

    const entries = extractEntries(xml)

    if (entries.length === 0) {
      console.warn(`  ⚠ [${label}] No results returned`)
    } else {
      console.log(`  [${label}] Got ${entries.length} papers`)
    }

    const papers = entries.map(parseEntry)
    querySummary[label] = papers.length
    allPapers.push(...papers)
  }

  // Deduplicate by arXiv ID
  const seen = new Set<string>()
  const deduplicated = allPapers.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  const dupeCount = allPapers.length - deduplicated.length
  if (dupeCount > 0) {
    console.log(`  Removed ${dupeCount} duplicate(s). Total unique: ${deduplicated.length}`)
  }

  if (deduplicated.length < 5) {
    console.warn(`  ⚠ Only ${deduplicated.length} candidates found (less than 5)`)
  }

  return { papers: deduplicated, querySummary }
}
