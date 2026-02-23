"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { Post } from "@/lib"

export type VotedPost = Post & { voteIsAnonymous: boolean }

type UseUserVotedPostsOptions = {
  filterAnonymous?: boolean
  enabled?: boolean
}

export function useUserVotedPosts({ filterAnonymous, enabled = true }: UseUserVotedPostsOptions) {
  const [posts, setPosts] = useState<VotedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/votes/history?limit=50", { method: "GET", signal })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load voted posts")
      }

      setPosts(payload.posts as VotedPost[])
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : "Failed to load voted posts")
      setPosts([])
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  const filteredPosts = useMemo(() => {
    if (filterAnonymous === undefined) return posts
    return posts.filter((p) => p.voteIsAnonymous === filterAnonymous)
  }, [posts, filterAnonymous])

  // Sync vote count changes and removals (un-vote) from VoteButton broadcasts
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ targetType: string; targetId: string; isAnonymous: boolean; userVote: number; voteCount: number }>).detail
      if (detail.targetType !== "post") return
      setPosts((prev) =>
        prev
          .filter((p) => !(p.id === detail.targetId && p.voteIsAnonymous === detail.isAnonymous && detail.userVote === 0))
          .map((p) => (p.id === detail.targetId ? { ...p, voteCount: detail.voteCount } : p)),
      )
    }
    window.addEventListener("vote-sync", handler)
    return () => window.removeEventListener("vote-sync", handler)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      setPosts([])
      return
    }

    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [enabled, load])

  return { posts: filteredPosts, loading, error }
}
