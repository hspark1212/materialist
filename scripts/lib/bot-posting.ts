/**
 * Shared bot posting utilities.
 */

import { createScriptAdminClient } from "./supabase"
import type { ForumFlair, JobType, Section, ShowcaseType } from "@/lib/types"
import { BOT_PERSONAS, type BotPersona, VALID_PERSONAS } from "@/lib/bots"

export type BotPostInput = {
  title: string
  content: string
  section: Section
  tags: string[]
  flair?: ForumFlair
  jobType?: JobType
  company?: string
  location?: string
  applicationUrl?: string
  deadline?: string
  url?: string
  // Showcase fields
  showcaseType?: ShowcaseType
  projectUrl?: string
  techStack?: string[]
}

export type BotPostResult = {
  id: string
  url: string
}

/**
 * Resolve bot user ID by persona name.
 * Reads from environment variables set after running setup-bot-user.ts.
 */
export function resolveBotUserId(persona: string): string {
  const key = persona.toLowerCase() as BotPersona
  const config = BOT_PERSONAS[key]

  if (!config) {
    console.error(
      `Unknown persona: ${persona}\n` +
        `Available personas: ${VALID_PERSONAS.join(", ")}`
    )
    process.exit(1)
  }

  const id = process.env[config.envKey]
  if (!id) {
    console.error(
      `Bot user ID not found for ${persona}.\n` +
        `Please run: npx tsx scripts/setup-bot-user.ts --persona ${key}\n` +
        `Then add ${config.envKey}=<id> to .env.local`
    )
    process.exit(1)
  }

  return id
}

/**
 * Create a bot post in Supabase.
 */
export async function createBotPost(
  persona: string,
  input: BotPostInput
): Promise<BotPostResult> {
  const botUserId = resolveBotUserId(persona)
  const supabase = createScriptAdminClient()

  // Determine post type based on section
  const postType =
    input.section === "jobs"
      ? "job"
      : input.section === "showcase"
        ? "showcase"
        : input.section === "papers"
          ? "paper"
          : input.url
            ? "link"
            : "text"

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title,
      content: input.content,
      author_id: botUserId,
      section: input.section,
      type: postType,
      tags: input.tags,
      is_anonymous: false,
      doi: null,
      arxiv_id: null,
      url: input.url ?? null,
      flair: input.section === "forum" ? (input.flair ?? null) : null,
      project_url:
        input.section === "showcase" ? (input.projectUrl ?? null) : null,
      tech_stack:
        input.section === "showcase" ? (input.techStack ?? []) : [],
      showcase_type:
        input.section === "showcase" ? (input.showcaseType ?? null) : null,
      company: input.section === "jobs" ? (input.company ?? null) : null,
      location: input.section === "jobs" ? (input.location ?? null) : null,
      job_type: input.section === "jobs" ? (input.jobType ?? null) : null,
      application_url:
        input.section === "jobs" ? (input.applicationUrl ?? null) : null,
      deadline: input.section === "jobs" ? (input.deadline ?? null) : null,
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
  const postUrl = `${baseUrl}/${input.section}/${data.id}`

  return { id: data.id, url: postUrl }
}

/**
 * Print post result in a consistent format.
 */
export function printPostResult(result: BotPostResult): void {
  console.log(`\nSuccess!`)
  console.log(`Post ID: ${result.id}`)
  console.log(`URL: ${result.url}`)
}
