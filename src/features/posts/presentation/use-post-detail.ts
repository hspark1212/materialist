"use client"

import { useCallback, useEffect, useState } from "react"

import type { Comment, Post } from "@/lib"
import type { CommentSort } from "../domain/types"

type UsePostDetailResult = {
  post: Post | null
  comments: Comment[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePostDetail(postId: string, commentSort: CommentSort): UsePostDetailResult {
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ commentSort })
        const response = await fetch(`/api/posts/${postId}?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal,
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load post")
        }

        setPost(payload.post as Post)
        setComments(payload.comments as Comment[])
      } catch (err) {
        if (signal?.aborted) return
        setError(err instanceof Error ? err.message : "Failed to load post")
        setPost(null)
        setComments([])
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [commentSort, postId],
  )

  useEffect(() => {
    if (!postId) return

    const controller = new AbortController()
    void load(controller.signal)

    return () => controller.abort()
  }, [postId, load])

  return {
    post,
    comments,
    loading,
    error,
    refresh: async () => {
      await load()
    },
  }
}
