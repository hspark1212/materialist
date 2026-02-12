import { NextRequest, NextResponse } from "next/server"

import { handleApiError } from "@/features/posts/api/http"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const authorId = request.nextUrl.searchParams.get("authorId")

    if (!authorId) {
      return NextResponse.json({ comments: [] })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("comments")
      .select("id,content,created_at,post_id,posts(title)")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      throw new Error(`Failed to list comments: ${error.message}`)
    }

    const comments = (data ?? []).map((row: unknown) => {
      const record = row as {
        id: string
        content: string
        created_at: string
        post_id: string
        posts?: { title?: string | null } | null
      }

      return {
        id: record.id,
        content: record.content,
        createdAt: record.created_at,
        postId: record.post_id,
        postTitle: record.posts?.title ?? "(deleted post)",
      }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    return handleApiError(error)
  }
}
