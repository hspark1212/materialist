import * as fs from "node:fs"
import * as path from "node:path"

import { DEFAULT_CONFIG, QUERY_LABELS, searchArxiv } from "./lib/arxiv"
import { DEFAULT_GEMINI_CONFIG, evaluatePapers, filterPapers } from "./lib/gemini"
import { createScriptAdminClient } from "./lib/supabase"
import type { ArxivPaper, CuratedPaper, CurationResult } from "./lib/types"

// ── CLI arg parsing ──

const DEFAULT_PERSONA = "mendeleev"

function parseArgs(): { phase?: number; date: string; persona: string } {
  const args = process.argv.slice(2)
  let phase: number | undefined
  let date = new Date(Date.now() - 86400000).toISOString().slice(0, 10) // yesterday
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

/** Convert a YYYY-MM-DD date string to arXiv submittedDate range (full day) */
function toDateRange(date: string): { from: string; to: string } | undefined {
  const compact = date.replace(/-/g, "")
  if (compact.length !== 8) return undefined
  return { from: `${compact}0000`, to: `${compact}2359` }
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

// ── Phase 1: arXiv collection ──

async function runPhase1(date: string): Promise<ArxivPaper[]> {
  console.log(`\n=== Phase 1: arXiv Paper Collection ===\n`)

  const config = { ...DEFAULT_CONFIG, dateRange: toDateRange(date) }
  const { papers, querySummary } = await searchArxiv(config)

  console.log(`\n  Summary:`)
  for (const [label, count] of Object.entries(querySummary)) {
    console.log(`    ${label}: ${count} papers`)
  }
  console.log(`    Total unique candidates: ${papers.length}`)

  const outFile = writeJson(`arxiv-candidates-${date}.json`, papers)
  console.log(`\n  Output: ${outFile}`)

  return papers
}

// ── Phase 2: Gemini evaluation ──

async function runPhase2(
  date: string,
  candidates?: ArxivPaper[]
): Promise<CuratedPaper[]> {
  console.log(`\n=== Phase 2: Gemini 2-Stage Evaluation ===\n`)

  // Load candidates from file if not provided
  const papers =
    candidates ?? readJson<ArxivPaper[]>(`arxiv-candidates-${date}.json`)

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

  // Show filtered-out papers
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

  // Build curated papers with scores
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

  // Select papers: above threshold, capped at topN
  const { topN, scoreThreshold } = DEFAULT_GEMINI_CONFIG
  const selected = curatedPapers
    .filter((p) => p.evaluation.overallScore >= scoreThreshold)
    .slice(0, topN)

  // Print ranking table
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

  const outFile = writeJson(`gemini-evaluations-${date}.json`, curatedPapers)
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
  date: string,
  persona: string,
  papers?: CuratedPaper[]
): Promise<void> {
  console.log(`\n=== Phase 3: Supabase Posting (${persona}) ===\n`)

  // Load selected papers from evaluation file if not provided
  const allEvaluated =
    papers ?? readJsonSafe(`gemini-evaluations-${date}.json`)

  if (!allEvaluated || allEvaluated.length === 0) {
    console.error(
      `  No evaluation data found for ${date}.\n` +
        `  Run Phase 1+2 first: npx tsx scripts/curate-papers.ts --date ${date}`
    )
    return
  }

  // Apply score threshold to get selected papers
  const { topN, scoreThreshold } = DEFAULT_GEMINI_CONFIG
  const selected = papers
    ? papers
    : allEvaluated
        .filter((p) => p.evaluation.overallScore >= scoreThreshold)
        .slice(0, topN)

  if (selected.length === 0) {
    console.log("  No papers to post.")
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

    const { error: insertError } = await supabase.from("posts").insert({
      title: paper.title,
      content: paper.abstract,
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

    console.log(`  POST: ${paper.title}`)
    posted++
  }

  console.log(
    `\n  Summary: posted ${posted}, skipped ${skipped} duplicates`
  )
}

// ── Full pipeline ──

async function runFullPipeline(date: string, persona: string): Promise<void> {
  const startTime = Date.now()

  console.log(`Paper Curation Pipeline — ${date}`)
  console.log("=".repeat(50))

  // Phase 1
  const candidates = await runPhase1(date)
  if (candidates.length === 0) {
    console.error("\nPipeline aborted: no candidates found.")
    process.exit(1)
  }

  // Phase 2
  const selectedPapers = await runPhase2(date, candidates)

  // Phase 3
  const envKey = `BOT_USER_ID_${persona.toUpperCase()}`
  if (process.env[envKey]) {
    await runPhase3(date, persona, selectedPapers)
  } else if (process.env.CI) {
    console.error(`\nError: ${envKey} is not set. Configure it as a GitHub Actions secret.`)
    process.exit(1)
  } else {
    console.log(`\n  Skipping Phase 3 (no ${envKey} set)`)
  }

  // Build final result
  const durationMs = Date.now() - startTime
  const allEvaluated = readJsonSafe(`gemini-evaluations-${date}.json`)
  const result: CurationResult = {
    runDate: date,
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

  const outFile = writeJson(`curated-papers-${date}.json`, result)

  console.log(`\n${"=".repeat(50)}`)
  console.log(`Pipeline complete in ${(durationMs / 1000).toFixed(1)}s`)
  console.log(`  Candidates: ${result.candidateCount}`)
  console.log(`  Filtered: ${result.filteredCount}`)
  console.log(`  Selected: ${result.selectedCount}`)
  console.log(`  Output: ${outFile}`)
}

function readJsonSafe(filename: string): CuratedPaper[] | null {
  try {
    return readJson<CuratedPaper[]>(filename)
  } catch {
    return null
  }
}

// ── Main ──

async function main(): Promise<void> {
  const { phase, date, persona } = parseArgs()

  try {
    if (phase === 1) {
      await runPhase1(date)
    } else if (phase === 2) {
      await runPhase2(date)
    } else if (phase === 3) {
      await runPhase3(date, persona)
    } else {
      await runFullPipeline(date, persona)
    }
  } catch (err) {
    console.error("\nFatal error:", err)
    process.exit(1)
  }
}

main()
