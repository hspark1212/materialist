"use client"

import { useEffect, useState } from "react"

import type { Section } from "@/lib/types"

export type TrendingPost = {
  id: string
  title: string
  section: Section
  vote_count: number
  content: string
}

export function useTrendingPosts(limit = 3, daysBack = 30) {
  const [posts, setPosts] = useState<TrendingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/topics/trending-posts?limit=${limit}&days=${daysBack}`)

        if (!response.ok) {
          throw new Error("Failed to fetch trending posts")
        }

        const data = await response.json()
        setPosts(data.posts as TrendingPost[])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("Failed to fetch trending posts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [limit, daysBack])

  return { posts, loading, error }
}
