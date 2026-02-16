import * as fs from "node:fs"
import * as path from "node:path"

import { DEFAULT_CONFIG, QUERY_LABELS, searchArxiv } from "./lib/arxiv"
import { DEFAULT_GEMINI_CONFIG, evaluatePapers, filterPapers } from "./lib/gemini"
import { createScriptAdminClient } from "./lib/supabase"
import type { ArxivPaper, CuratedPaper, CurationResult } from "./lib/types"

// ── CLI arg parsing ──

const DEFAULT_PERSONA = "mendeleev"

function parseArgs(): { phase?: number; date?: string; persona: string } {
  const args = process.argv.slice(2)
  let phase: number | undefined
  let date: string | undefined
  let persona = DEFAULT_PERSONA

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--phase" && args[i + 1]) {
      phase = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === "--date" && args[i + 1]) {
      date = args[i + 1]
      i++
    } else if (args[i] === "--persona" && args[i + 1]) {
      persona = args[i + 1]
      i++
    }
  }

  return { phase, date, persona }
}

// ── Date helpers ──

/** Get yesterday's date in YYYY-MM-DD (UTC) */
function yesterday(): string {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

/** Add N days to a YYYY-MM-DD date string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Count calendar days between two YYYY-MM-DD dates (inclusive) */
function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z")
  const b = new Date(to + "T00:00:00Z")
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}

/** Convert YYYY-MM-DD to arXiv submittedDate compact format */
function toCompact(dateStr: string): string {
  return dateStr.replace(/-/g, "")
}

// ── DB date lookup ──

/**
 * Query Supabase for the latest paper date posted by the bot.
 * Extracts dates from title prefix "[YYYY-MM-DD]".
 * Returns null if no bot papers exist.
 */
async function getLatestPaperDate(): Promise<string | null> {
  const supabase = createScriptAdminClient()

  const { data, error } = await supabase
    .from("posts")
    .select("title")
    .eq("section", "papers")
    .not("arxiv_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(`Failed to query latest paper date: ${error.message}`)
  }

  if (!data?.length) return null

  let maxDate = ""
  for (const row of data) {
    const match = (row.title as string).match(/^\[(\d{4}-\d{2}-\d{2})\]/)
    if (match && match[1] > maxDate) maxDate = match[1]
  }

  return maxDate || null
}

// ── File I/O ──

const OUTPUT_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "output"
)

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function writeJson(filename: string, data: unknown): string {
  ensureOutputDir()
  const filepath = path.join(OUTPUT_DIR, filename)
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + "\n")
  return filepath
}

function readJson<T>(filename: string): T {
  const filepath = path.join(OUTPUT_DIR, filename)
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`)
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8")) as T
}

function readJsonSafe(filename: string): CuratedPaper[] | null {
  try {
    return readJson<CuratedPaper[]>(filename)
  } catch {
    return null
  }
}

// ── Phase 1: arXiv collection ──

async function runPhase1(
  fromDate: string,
  toDate: string
): Promise<ArxivPaper[]> {
  console.log(`\n=== Phase 1: arXiv Paper Collection ===\n`)
  console.log(`  Search range: ${fromDate} → ${toDate}`)

  const days = daysBetween(fromDate, toDate)
  console.log(`  Days in range: ${days}`)

  // Scale maxResults by number of days (min 25, max 100)
  const maxResults = Math.min(100, Math.max(25, 25 * days))

  const config = {
    ...DEFAULT_CONFIG,
    maxResultsPerQuery: maxResults,
    dateRange: {
      from: `${toCompact(fromDate)}0000`,
      to: `${toCompact(toDate)}2359`,
    },
  }

  const result = await searchArxiv(config)

  console.log(`\n  Summary:`)
  for (const [label, count] of Object.entries(result.querySummary)) {
    console.log(`    ${label}: ${count} papers`)
  }
  console.log(`    Total unique candidates: ${result.papers.length}`)

  const tag = fromDate === toDate ? fromDate : `${fromDate}_${toDate}`
  const outFile = writeJson(`arxiv-candidates-${tag}.json`, result.papers)
  console.log(`\n  Output: ${outFile}`)

  return result.papers
}

// ── Phase 2: Gemini evaluation ──

async function runPhase2(
  tag: string,
  candidates?: ArxivPaper[]
): Promise<CuratedPaper[]> {
  console.log(`\n=== Phase 2: Gemini 2-Stage Evaluation ===\n`)

  const papers =
    candidates ?? readJson<ArxivPaper[]>(`arxiv-candidates-${tag}.json`)

  if (papers.length === 0) {
    console.error("  No candidates to evaluate.")
    return []
  }

  // Stage 1: Filter
  const filterResults = await filterPapers(papers)

  const relevantIds = new Set(
    filterResults.filter((r) => r.isRelevant).map((r) => r.arxivId)
  )
  const filteredPapers = papers.filter((p) => relevantIds.has(p.id))

  console.log(
    `\n  Stage 1 results: ${relevantIds.size} relevant / ${papers.length - relevantIds.size} filtered out`
  )

  const rejected = filterResults.filter((r) => !r.isRelevant)
  if (rejected.length > 0) {
    console.log(`\n  Filtered out:`)
    for (const r of rejected) {
      const paper = papers.find((p) => p.id === r.arxivId)
      console.log(`    - ${paper?.title ?? r.arxivId}: ${r.briefReason}`)
    }
  }

  if (filteredPapers.length === 0) {
    console.error("  No papers passed filtering.")
    return []
  }

  // Stage 2: Evaluate
  const evaluations = await evaluatePapers(filteredPapers)

  const curatedPapers: CuratedPaper[] = filteredPapers
    .map((p) => {
      const evaluation = evaluations.get(p.id)
      if (!evaluation) return null
      return {
        arxivId: p.id,
        title: p.title,
        abstract: p.abstract,
        authors: p.authors,
        categories: p.categories,
        published: p.published,
        absUrl: p.absUrl,
        pdfUrl: p.pdfUrl,
        evaluation,
      }
    })
    .filter((p): p is CuratedPaper => p !== null)
    .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore)

  const { topN, scoreThreshold } = DEFAULT_GEMINI_CONFIG
  const selected = curatedPapers
    .filter((p) => p.evaluation.overallScore >= scoreThreshold)
    .slice(0, topN)

  const selectedIds = new Set(selected.map((p) => p.arxivId))
  console.log(`\n  Full ranking (threshold ≥ ${scoreThreshold}, max ${topN}):`)
  curatedPapers.forEach((p, i) => {
    const e = p.evaluation
    const marker = selectedIds.has(p.arxivId) ? " *" : ""
    console.log(
      `    ${i + 1}. [${e.overallScore}] ${p.title}${marker}`
    )
    console.log(`       ${e.reasoning}`)
  })
  console.log(`\n  (* = selected, ${selected.length} papers above ${scoreThreshold})`)

  const outFile = writeJson(`gemini-evaluations-${tag}.json`, curatedPapers)
  console.log(`\n  Output: ${outFile}`)

  return selected
}

// ── Phase 3: Supabase posting ──

function resolveBotUserId(persona: string): string {
  const envKey = `BOT_USER_ID_${persona.toUpperCase()}`
  const id = process.env[envKey]
  if (!id) {
    console.error(
      `Missing ${envKey} env var.\n` +
        `Run: npx tsx scripts/setup-bot-user.ts --persona ${persona}\n` +
        `Then add ${envKey}=<uuid> to .env.local`
    )
    process.exit(1)
  }
  return id
}

async function runPhase3(
  tag: string,
  persona: string,
  papers?: CuratedPaper[]
): Promise<void> {
  console.log(`\n=== Phase 3: Supabase Posting (${persona}) ===\n`)

  let selected: CuratedPaper[]

  if (papers) {
    selected = papers
  } else {
    const allEvaluated = readJsonSafe(`gemini-evaluations-${tag}.json`)
    if (!allEvaluated || allEvaluated.length === 0) {
      console.error(
        `  No evaluation data found for ${tag}.\n` +
          `  Run Phase 1+2 first: npx tsx scripts/curate-papers.ts --date <date>`
      )
      return
    }
    const { topN, scoreThreshold } = DEFAULT_GEMINI_CONFIG
    selected = allEvaluated
      .filter((p) => p.evaluation.overallScore >= scoreThreshold)
      .slice(0, topN)
  }

  if (selected.length === 0) {
    console.log("  No papers above threshold. Nothing to post.")
    return
  }

  const botUserId = resolveBotUserId(persona)
  const supabase = createScriptAdminClient()

  // Check which arxiv_ids already exist
  const arxivIds = selected.map((p) => p.arxivId)
  const { data: existing, error: lookupError } = await supabase
    .from("posts")
    .select("arxiv_id")
    .in("arxiv_id", arxivIds)

  if (lookupError) {
    throw new Error(`Duplicate check failed: ${lookupError.message}`)
  }

  const existingIds = new Set((existing ?? []).map((r) => r.arxiv_id))

  let posted = 0
  let skipped = 0

  for (const paper of selected) {
    if (existingIds.has(paper.arxivId)) {
      console.log(`  SKIP (duplicate): ${paper.title}`)
      skipped++
      continue
    }

    // Use the paper's actual submission date for the title
    const paperDate = paper.published.slice(0, 10)
    const formattedTitle = `[${paperDate}] ${paper.title}`
    const formattedContent = [
      `**Summary:** ${paper.evaluation.summary}`,
      '',
      `**Why this paper?** ${paper.evaluation.reasoning}`,
      '',
      `**Abstract:** ${paper.abstract}`,
      '',
      `**Authors:** ${paper.authors.join(', ')}`,
    ].join('\n')

    const { error: insertError } = await supabase.from("posts").insert({
      title: formattedTitle,
      content: formattedContent,
      author_id: botUserId,
      section: "papers",
      type: "paper",
      tags: paper.evaluation.suggestedTags,
      is_anonymous: false,
      doi: null,
      arxiv_id: paper.arxivId,
      url: paper.absUrl,
      flair: null,
      project_url: null,
      tech_stack: [],
      showcase_type: null,
      company: null,
      location: null,
      job_type: null,
      application_url: null,
    })

    if (insertError) {
      console.error(`  FAIL: ${paper.title} — ${insertError.message}`)
      continue
    }

    console.log(`  POST: ${formattedTitle}`)
    posted++
  }

  console.log(
    `\n  Summary: posted ${posted}, skipped ${skipped} duplicates`
  )
}

// ── Full pipeline ──

async function runFullPipeline(
  fromDate: string,
  toDate: string,
  persona: string
): Promise<void> {
  const startTime = Date.now()
  const tag = fromDate === toDate ? fromDate : `${fromDate}_${toDate}`

  console.log(`Paper Curation Pipeline`)
  console.log(`  Range: ${fromDate} → ${toDate}`)
  console.log("=".repeat(50))

  // Phase 1
  const candidates = await runPhase1(fromDate, toDate)
  if (candidates.length === 0) {
    console.log("\nNo candidates found — likely a weekend or holiday. Skipping.")
    process.exit(0)
  }

  // Phase 2
  const selectedPapers = await runPhase2(tag, candidates)

  // Phase 3
  const envKey = `BOT_USER_ID_${persona.toUpperCase()}`
  if (process.env[envKey]) {
    await runPhase3(tag, persona, selectedPapers)
  } else if (process.env.CI) {
    console.error(`\nError: ${envKey} is not set. Configure it as a GitHub Actions secret.`)
    process.exit(1)
  } else {
    console.log(`\n  Skipping Phase 3 (no ${envKey} set)`)
  }

  // Build final result
  const durationMs = Date.now() - startTime
  const allEvaluated = readJsonSafe(`gemini-evaluations-${tag}.json`)
  const result: CurationResult = {
    runDate: tag,
    candidateCount: candidates.length,
    filteredCount: allEvaluated?.length ?? selectedPapers.length,
    selectedCount: selectedPapers.length,
    papers: selectedPapers,
    metadata: {
      queries: QUERY_LABELS,
      filterModel: DEFAULT_GEMINI_CONFIG.filterModel,
      evaluationModel: DEFAULT_GEMINI_CONFIG.evaluationModel,
      durationMs,
    },
  }

  const outFile = writeJson(`curated-papers-${tag}.json`, result)

  console.log(`\n${"=".repeat(50)}`)
  console.log(`Pipeline complete in ${(durationMs / 1000).toFixed(1)}s`)
  console.log(`  Candidates: ${result.candidateCount}`)
  console.log(`  Filtered: ${result.filteredCount}`)
  console.log(`  Selected: ${result.selectedCount}`)
  console.log(`  Output: ${outFile}`)
}

// ── Main ──

async function main(): Promise<void> {
  const { phase, date, persona } = parseArgs()

  try {
    // Determine date range
    let fromDate: string
    let toDate: string

    if (date) {
      // Manual override: single date
      fromDate = date
      toDate = date
      console.log(`Manual date override: ${date}`)
    } else {
      // Auto-detect: query DB for latest paper date
      console.log("Auto-detecting date range from database...")
      const latestDate = await getLatestPaperDate()
      toDate = yesterday()

      if (latestDate) {
        fromDate = addDays(latestDate, 1)
        console.log(`  Latest paper in DB: ${latestDate}`)
        console.log(`  Searching: ${fromDate} → ${toDate}`)
      } else {
        // No papers in DB yet — just fetch yesterday
        fromDate = toDate
        console.log(`  No papers in DB. Fetching yesterday: ${toDate}`)
      }

      // If we're already up to date, nothing to do
      if (fromDate > toDate) {
        console.log(`  Already up to date (latest: ${latestDate}, yesterday: ${toDate}). Nothing to fetch.`)
        process.exit(0)
      }
    }

    const tag = fromDate === toDate ? fromDate : `${fromDate}_${toDate}`

    if (phase === 1) {
      await runPhase1(fromDate, toDate)
    } else if (phase === 2) {
      await runPhase2(tag)
    } else if (phase === 3) {
      await runPhase3(tag, persona)
    } else {
      await runFullPipeline(fromDate, toDate, persona)
    }
  } catch (err) {
    console.error("\nFatal error:", err)
    process.exit(1)
  }
}

main()
