// ── arXiv types ──

export type ArxivPaper = {
  id: string
  title: string
  abstract: string
  authors: string[]
  categories: string[]
  published: string
  pdfUrl: string
  absUrl: string
}

export type ArxivSearchConfig = {
  queries: string[]
  maxResultsPerQuery: number
  sortBy: "submittedDate" | "relevance" | "lastUpdatedDate"
  sortOrder: "descending" | "ascending"
  dateRange?: { from: string; to: string }
}

// ── Gemini types ──

export type FilterResult = {
  arxivId: string
  isRelevant: boolean
  briefReason: string
}

export type PaperEvaluation = {
  relevanceScore: number
  noveltyScore: number
  impactScore: number
  clarityScore: number
  overallScore: number
  reasoning: string
  suggestedTags: string[]
}

export type GeminiConfig = {
  filterModel: string
  evaluationModel: string
  topN: number
  scoreThreshold: number
}

// ── Pipeline output types ──

export type CuratedPaper = {
  arxivId: string
  title: string
  abstract: string
  authors: string[]
  categories: string[]
  published: string
  absUrl: string
  pdfUrl: string
  evaluation: PaperEvaluation
}

export type CurationResult = {
  runDate: string
  candidateCount: number
  filteredCount: number
  selectedCount: number
  papers: CuratedPaper[]
  metadata: {
    queries: string[]
    filterModel: string
    evaluationModel: string
    durationMs: number
  }
}
