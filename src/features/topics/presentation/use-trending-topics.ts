"use client"

import { useEffect, useState } from "react"

import type { TrendingTopic } from "../domain/types"

export function useTrendingTopics(limit = 8, daysBack = 7) {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/topics/trending?limit=${limit}&days=${daysBack}`)

        if (!response.ok) {
          throw new Error("Failed to fetch trending topics")
        }

        const data = await response.json()
        setTopics(data.topics)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("Failed to fetch trending topics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [limit, daysBack])

  return { topics, loading, error }
}
