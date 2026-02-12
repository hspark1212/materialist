"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export type UserCommentActivity = {
  id: string
  content: string
  createdAt: string
  postId: string
  postTitle: string
  isAnonymous: boolean
}

type UseUserCommentsOptions = {
  authorId?: string
  filterAnonymous?: boolean
  enabled?: boolean
}

export function useUserComments({ authorId, filterAnonymous, enabled = true }: UseUserCommentsOptions) {
  const [comments, setComments] = useState<UserCommentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (authorId) {
      params.set("authorId", authorId)
    }
    return params.toString()
  }, [authorId])

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!authorId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/comments?${queryString}`, {
        method: "GET",
        signal,
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load comments")
      }

      setComments(payload.comments as UserCommentActivity[])
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : "Failed to load comments")
      setComments([])
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [authorId, queryString])

  const filteredComments = useMemo(() => {
    if (filterAnonymous === undefined) return comments
    return comments.filter((comment) => comment.isAnonymous === filterAnonymous)
  }, [comments, filterAnonymous])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      setComments([])
      return
    }

    if (!authorId) return

    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [authorId, enabled, load])

  return {
    comments: filteredComments,
    loading,
    error,
    refresh: () => load(),
  }
}
