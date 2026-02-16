"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import type { Post } from "@/lib"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { PostComposer } from "@/components/post/post-composer"

export default function PostEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, status } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) return

    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch(`/api/posts/${params.id}`, {
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load post")
        }

        setPost(payload.post as Post)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Failed to load post")
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => controller.abort()
  }, [params.id])

  if (loading || status === "loading") {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <p className="text-lg font-semibold">Post not found</p>
        {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
      </div>
    )
  }

  if (!user || user.id !== post.author.id) {
    router.replace(`/post/${params.id}`)
    return null
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon-sm" className="min-h-11 min-w-11 shrink-0">
          <Link href={`/post/${params.id}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <span className="text-muted-foreground text-xs sm:text-sm">Back to post</span>
      </div>

      <PostComposer initialPost={post} />
    </div>
  )
}
