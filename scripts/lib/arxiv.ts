import type { ArxivPaper, ArxivSearchConfig, RssFeedConfig } from "./types"

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

// ── RSS keyword arrays (extracted from search queries above) ──

const ML_KEYWORDS = [
  "machine learning",
  "deep learning",
  "neural network",
  "graph neural",
  "generative model",
  "foundation model",
  "language model",
]

const MATERIALS_KEYWORDS = [
  "materials science",
  "materials discovery",
  "crystal structure",
  "molecular dynamics",
  "density functional",
  "electronic structure",
  "alloy",
  "polymer",
  "catalysis",
]

export const RSS_FEED_CONFIG: RssFeedConfig = {
  groups: [
    {
      label: "Materials→AI",
      categories: ["cond-mat.mtrl-sci", "cond-mat.mes-hall", "physics.comp-ph"],
      abstractKeywords: ML_KEYWORDS,
    },
    {
      label: "AI→Materials",
      categories: ["cs.LG", "cs.AI"],
      abstractKeywords: MATERIALS_KEYWORDS,
    },
  ],
}

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

// ── RSS feed fetching ──

type ParsedSummary = {
  arxivId: string
  announceType: string
  abstract: string
}

/**
 * Parse RSS `<summary>` content.
 * Format: "arXiv:2602.12345v1 Announce Type: new\nAbstract: ..."
 */
function parseAtomSummary(raw: string): ParsedSummary | null {
  const text = decodeXmlEntities(raw).trim()

  const idMatch = text.match(/arXiv:(\d+\.\d+)(?:v\d+)?/)
  if (!idMatch) return null

  const typeMatch = text.match(/Announce Type:\s*(\S+)/)
  const announceType = typeMatch ? typeMatch[1] : "unknown"

  const absMatch = text.match(/Abstract:\s*([\s\S]*)/)
  const abstract = absMatch ? normalizeWhitespace(absMatch[1]) : ""

  return { arxivId: idMatch[1], announceType, abstract }
}

/** Extract authors from RSS `<dc:creator>` (comma-and-newline separated) */
function extractRssAuthors(entry: string): string[] {
  const m = entry.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/)
  if (!m) return []
  return m[1]
    .split(/,\s*\n\s*|\n\s*/)
    .map((a) => normalizeWhitespace(decodeXmlEntities(a)))
    .filter(Boolean)
}

/** Parse an RSS entry into an ArxivPaper, or null if it should be skipped */
function parseRssEntry(entry: string): ArxivPaper | null {
  const summaryRaw = extractTag(entry, "summary")
  const parsed = parseAtomSummary(summaryRaw)
  if (!parsed) return null

  // Filter out replace/replace-cross (updates to already-announced papers)
  if (parsed.announceType === "replace" || parsed.announceType === "replace-cross") {
    return null
  }

  const id = parsed.arxivId
  const title = extractTag(entry, "title")
  const authors = extractRssAuthors(entry)
  const categories = extractCategories(entry)

  return {
    id,
    title: normalizeWhitespace(title),
    abstract: parsed.abstract,
    authors,
    categories,
    published: extractTag(entry, "updated"),
    absUrl: `https://arxiv.org/abs/${id}`,
    pdfUrl: `https://arxiv.org/pdf/${id}`,
  }
}

/** Check if text contains any of the keywords (case-insensitive) */
function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}

/**
 * Fetch papers from arXiv RSS/Atom feeds.
 * Returns the same shape as searchArxiv() for downstream compatibility.
 */
export async function fetchRssPapers(
  config: RssFeedConfig = RSS_FEED_CONFIG
): Promise<{ papers: ArxivPaper[]; querySummary: Record<string, number> }> {
  const allPapers: ArxivPaper[] = []
  const querySummary: Record<string, number> = {}

  for (let i = 0; i < config.groups.length; i++) {
    const group = config.groups[i]

    if (i > 0) {
      console.log("  Waiting 3s (rate limit)...")
      await sleep(3000)
    }

    const catPath = group.categories.join("+")
    const url = `https://rss.arxiv.org/atom/${catPath}`
    console.log(`  [${group.label}] Fetching RSS: ${url}`)

    const xml = await fetchWithRetry(url, 2, 5000)
    const entries = extractEntries(xml)
    console.log(`  [${group.label}] Got ${entries.length} entries`)

    // Parse entries, filter announce type, then filter by keywords
    let matched = 0
    for (const entry of entries) {
      const paper = parseRssEntry(entry)
      if (!paper) continue

      if (!matchesKeywords(paper.abstract, group.abstractKeywords)) continue

      allPapers.push(paper)
      matched++
    }

    console.log(`  [${group.label}] ${matched} papers matched keywords`)
    querySummary[group.label] = matched
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
