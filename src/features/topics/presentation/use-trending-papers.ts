"use client"

import { useEffect, useState } from "react"

export type TrendingPaper = {
  id: string
  title: string
  url: string | null
  arxiv_id: string | null
  doi: string | null
  vote_count: number
}

function getPaperHref(paper: TrendingPaper): string {
  return `/post/${paper.id}`
}

export function useTrendingPapers(limit = 3, daysBack = 7) {
  const [papers, setPapers] = useState<(TrendingPaper & { href: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/topics/trending-papers?limit=${limit}&days=${daysBack}`)

        if (!response.ok) {
          throw new Error("Failed to fetch trending papers")
        }

        const data = await response.json()
        setPapers(
          (data.papers as TrendingPaper[]).map((p) => ({ ...p, href: getPaperHref(p) }))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("Failed to fetch trending papers:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPapers()
  }, [limit, daysBack])

  return { papers, loading, error }
}
