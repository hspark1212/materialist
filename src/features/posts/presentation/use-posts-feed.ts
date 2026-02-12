"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { Post, Section } from "@/lib"
import type { PostSort } from "../domain/types"

type UsePostsFeedOptions = {
  section?: Section
  authorId?: string
  filterAnonymous?: boolean
  tag?: string
  query?: string
  sortBy: PostSort
  limit?: number
  enabled?: boolean
}

type FetchResult = {
  posts: Post[]
  hasMore: boolean
  nextOffset: number | null
}

export function usePostsFeed({
  section,
  authorId,
  filterAnonymous,
  tag,
  query,
  sortBy,
  limit = 20,
  enabled = true,
}: UsePostsFeedOptions) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const nextOffsetRef = useRef<number | null>(null)

  const baseQueryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set("sort", sortBy)
    if (section) {
      params.set("section", section)
    }
    if (authorId) {
      params.set("authorId", authorId)
    }
    if (tag) {
      params.set("tag", tag)
    }
    if (query) {
      params.set("q", query)
    }
    params.set("limit", String(limit))
    return params.toString()
  }, [section, authorId, tag, query, sortBy, limit])

  const fetchPosts = useCallback(
    async (offset: number, signal?: AbortSignal): Promise<FetchResult | null> => {
      const queryString = `${baseQueryString}&offset=${offset}`
      try {
        const response = await fetch(`/api/posts?${queryString}`, {
          method: "GET",
          signal,
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load posts")
        }

        return {
          posts: payload.posts as Post[],
          hasMore: payload.hasMore as boolean,
          nextOffset: payload.nextOffset as number | null,
        }
      } catch (err) {
        if (signal?.aborted) return null
        throw err
      }
    },
    [baseQueryString],
  )

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchPosts(0, signal)
        if (result) {
          setPosts(result.posts)
          setHasMore(result.hasMore)
          nextOffsetRef.current = result.nextOffset
        }
      } catch (err) {
        if (signal?.aborted) return
        setError(err instanceof Error ? err.message : "Failed to load posts")
        setPosts([])
        setHasMore(false)
        nextOffsetRef.current = null
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [fetchPosts],
  )

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || nextOffsetRef.current === null) return

    // Capture current baseQueryString to detect stale responses
    const currentQuery = baseQueryString

    setLoadingMore(true)
    setError(null)

    try {
      const result = await fetchPosts(nextOffsetRef.current)
      // Stale check: ignore result if filter changed during request
      if (result && baseQueryString === currentQuery) {
        setPosts((prev) => [...prev, ...result.posts])
        setHasMore(result.hasMore)
        nextOffsetRef.current = result.nextOffset
      }
    } catch (err) {
      if (baseQueryString === currentQuery) {
        setError(err instanceof Error ? err.message : "Failed to load more posts")
      }
    } finally {
      if (baseQueryString === currentQuery) {
        setLoadingMore(false)
      }
    }
  }, [fetchPosts, hasMore, loadingMore, baseQueryString])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      setPosts([])
      setHasMore(false)
      nextOffsetRef.current = null
      return
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [enabled, load])

  const filteredPosts = useMemo(() => {
    if (filterAnonymous === undefined) return posts
    return posts.filter((post) => post.isAnonymous === filterAnonymous)
  }, [posts, filterAnonymous])

  return {
    posts: filteredPosts,
    totalPosts: posts.length,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh: () => load(),
  }
}
