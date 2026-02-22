import "server-only"

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

type PostMetadataRow = {
  id: string
  title: string
  content: string
  section: string
  tags: string[] | null
  is_anonymous: boolean
  created_at: string
  updated_at: string
  comment_count: number
  profiles: { display_name: string; is_anonymous: boolean; generated_display_name: string | null } | null
}

export const getPostMetadata = cache(async (postId: string): Promise<PostMetadataRow | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, content, section, tags, is_anonymous, created_at, updated_at, comment_count, profiles(display_name, is_anonymous, generated_display_name)",
    )
    .eq("id", postId)
    .maybeSingle()

  return data as PostMetadataRow | null
})
