import { GoogleGenerativeAI } from "@google/generative-ai"

import type {
  ArxivPaper,
  FilterResult,
  GeminiConfig,
  PaperEvaluation,
} from "./types"

export const DEFAULT_GEMINI_CONFIG: GeminiConfig = {
  filterModel: "gemini-2.5-flash-lite",
  evaluationModel: "gemini-2.5-flash",
  topN: 5,
  scoreThreshold: 8.5,
}

// ── Helpers ──

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error("Error: GEMINI_API_KEY is not set.")
    console.error("Set it in .env.local or export it as an environment variable.")
    process.exit(1)
  }
  return key
}

function stripMarkdownFence(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "")
}

function parseJsonResponse<T>(text: string): T {
  const cleaned = stripMarkdownFence(text.trim())
  return JSON.parse(cleaned) as T
}

async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  prompt: string,
  retries = 1
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      if (attempt < retries) {
        console.warn(`  ⚠ Gemini call failed, retrying... (${err instanceof Error ? err.message : err})`)
      } else {
        throw err
      }
    }
  }
  // The for-loop always returns or throws, but TypeScript can't prove it
  throw new Error("unreachable: retries exhausted")
}

// ── Stage 1: Filtering ──

function buildFilterPrompt(papers: ArxivPaper[]): string {
  const paperList = papers
    .map(
      (p, i) =>
        `[${i + 1}] ID: ${p.id}\nTitle: ${p.title}\nAbstract: ${p.abstract}\n`
    )
    .join("\n---\n")

  return `You are an expert in materials science and AI/ML. Your task is to filter arxiv papers to find those that genuinely sit at the intersection of MATERIALS SCIENCE and AI/ML.

"Materials science" means research involving real, physical materials — for example:
- Inorganic crystals, alloys, ceramics, semiconductors
- Polymers, composites, nanomaterials, thin films
- Catalysts, battery materials, photovoltaics
- Molecular/crystal structure prediction, property prediction for materials
- Interatomic potentials or force fields for materials simulation

A paper is RELEVANT if it:
- Applies AI/ML methods to solve a materials science problem involving real materials
- OR develops AI/ML methodology specifically designed for materials data (crystal structures, phase diagrams, alloy compositions, etc.)

A paper is NOT RELEVANT if it:
- Is pure AI/ML methodology that only mentions "molecular dynamics" or "materials" as one of many application examples
- Is about biomolecular systems (proteins, drug discovery, genomics) — this is biology, not materials science
- Is about pure physics (quantum gases, BEC, high-energy physics, cosmology) without connection to real materials
- Is about fluid dynamics, music, image generation, or other non-materials domains
- Only uses "materials" keywords in passing but the core contribution is elsewhere

Be strict: when in doubt, mark as NOT relevant. We want high precision.

For each paper, return a JSON array with objects containing:
- "arxivId": the paper ID
- "isRelevant": true or false
- "briefReason": one sentence explaining why

Return ONLY a JSON array, no other text.

Papers to evaluate:

${paperList}`
}

export async function filterPapers(
  papers: ArxivPaper[],
  config: GeminiConfig = DEFAULT_GEMINI_CONFIG
): Promise<FilterResult[]> {
  const apiKey = getApiKey()
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: config.filterModel })

  console.log(
    `  Stage 1: Filtering ${papers.length} papers with ${config.filterModel}...`
  )

  const prompt = buildFilterPrompt(papers)
  const text = await generateWithRetry(model, prompt)

  try {
    return parseJsonResponse<FilterResult[]>(text)
  } catch {
    console.warn("  ⚠ JSON parse failed, retrying Stage 1...")
    const retryText = await generateWithRetry(model, prompt)
    return parseJsonResponse<FilterResult[]>(retryText)
  }
}

// ── Stage 2: Evaluation ──

function buildEvaluationPrompt(papers: ArxivPaper[]): string {
  const paperList = papers
    .map(
      (p, i) =>
        `[${i + 1}] ID: ${p.id}\nTitle: ${p.title}\nCategories: ${p.categories.join(", ")}\nAbstract: ${p.abstract}\n`
    )
    .join("\n---\n")

  return `You are an expert reviewer evaluating papers at the intersection of materials science and AI/ML. Score each paper on four criteria (1-10 scale):

1. **Relevance** — How well does it address the materials + AI intersection?
2. **Novelty** — Does it propose a new approach, model, or discovery?
3. **Impact** — Could this work have significant practical or scientific impact?
4. **Clarity** — Is the abstract well-written and the contribution clearly stated?

For each paper, also provide:
- "reasoning": 2-3 sentences explaining your scores
- "summary": 1-2 sentences summarizing the paper's key contribution for a materials science audience
- "suggestedTags": 2-5 kebab-case tags (e.g., "crystal-structure", "gnn", "property-prediction")

Return ONLY a JSON array of objects with these fields:
- "arxivId": string
- "relevanceScore": number (1-10)
- "noveltyScore": number (1-10)
- "impactScore": number (1-10)
- "clarityScore": number (1-10)
- "reasoning": string
- "summary": string
- "suggestedTags": string[]

Return ONLY a JSON array, no other text.

Papers to evaluate:

${paperList}`
}

type RawEvaluation = Omit<PaperEvaluation, "overallScore"> & {
  arxivId: string
}

function computeOverallScore(raw: RawEvaluation): number {
  const score =
    raw.relevanceScore * 0.3 +
    raw.noveltyScore * 0.3 +
    raw.impactScore * 0.25 +
    raw.clarityScore * 0.15
  return Math.round(score * 10) / 10
}

export async function evaluatePapers(
  papers: ArxivPaper[],
  config: GeminiConfig = DEFAULT_GEMINI_CONFIG
): Promise<Map<string, PaperEvaluation>> {
  const apiKey = getApiKey()
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: config.evaluationModel })

  console.log(
    `  Stage 2: Evaluating ${papers.length} papers with ${config.evaluationModel}...`
  )

  const prompt = buildEvaluationPrompt(papers)
  const text = await generateWithRetry(model, prompt)

  let rawEvals: RawEvaluation[]
  try {
    rawEvals = parseJsonResponse<RawEvaluation[]>(text)
  } catch {
    console.warn("  ⚠ JSON parse failed, retrying Stage 2...")
    const retryText = await generateWithRetry(model, prompt)
    rawEvals = parseJsonResponse<RawEvaluation[]>(retryText)
  }

  const results = new Map<string, PaperEvaluation>()
  for (const raw of rawEvals) {
    results.set(raw.arxivId, {
      relevanceScore: raw.relevanceScore,
      noveltyScore: raw.noveltyScore,
      impactScore: raw.impactScore,
      clarityScore: raw.clarityScore,
      overallScore: computeOverallScore(raw),
      reasoning: raw.reasoning,
      summary: raw.summary,
      suggestedTags: raw.suggestedTags,
    })
  }

  return results
}
