/**
 * Unified Bot Posting Script
 *
 * Posts content to Materialist as one of the bot personas.
 * Each persona has a default section (can be overridden with --section):
 * - Mendeleev → Papers: Systematic paper curation (periodic table theme)
 * - Faraday → Jobs: Career opportunities (self-taught success theme)
 * - Pauling → Forum: Community discussions (chemical bonds theme)
 * - Curie → Showcase: Tools/datasets/innovations (pioneering discovery theme)
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *
 *   # Mendeleev - Paper post (auto-uses papers section)
 *   npx tsx scripts/bot-post.ts \
 *     --persona mendeleev \
 *     --title "..." --content "..." --tags "..."
 *
 *   # Faraday - Job posting (auto-uses jobs section)
 *   npx tsx scripts/bot-post.ts \
 *     --persona faraday \
 *     --job-type postdoc \
 *     --company "..." --location "..." \
 *     --title "..." --content "..." --tags "..."
 *
 *   # Pauling - Forum discussion (auto-uses forum section)
 *   npx tsx scripts/bot-post.ts \
 *     --persona pauling \
 *     --flair discussion \
 *     --title "..." --content "..." --tags "..."
 *
 *   # Curie - Showcase post (auto-uses showcase section)
 *   npx tsx scripts/bot-post.ts \
 *     --persona curie \
 *     --showcase-type tool \
 *     --project-url "..." \
 *     --title "..." --content "..." --tags "..."
 *
 *   # Dry run
 *   npx tsx scripts/bot-post.ts --persona pauling --flair discussion \
 *     --title "Test" --content "Test" --tags "test" --dry-run
 */

import {
  createBotPost,
  printPostResult,
  type BotPostInput,
} from "./lib/bot-posting"
import type { ForumFlair, JobType, Section, ShowcaseType } from "@/lib/types"
import { BOT_PERSONAS, VALID_PERSONAS, type BotPersona } from "@/lib/bots"
const VALID_SECTIONS: Section[] = ["forum", "jobs", "papers", "showcase"]
const VALID_FLAIRS: ForumFlair[] = ["discussion", "question", "career", "news"]
const VALID_JOB_TYPES: JobType[] = [
  "full-time",
  "part-time",
  "contract",
  "remote",
  "internship",
  "postdoc",
  "phd",
]
const VALID_SHOWCASE_TYPES: ShowcaseType[] = [
  "tool",
  "dataset",
  "model",
  "library",
  "workflow",
]

type Args = {
  persona: BotPersona
  section: Section
  title: string
  content: string
  tags: string[]
  flair?: ForumFlair
  jobType?: JobType
  company?: string
  location?: string
  applicationUrl?: string
  deadline?: string
  showcaseType?: ShowcaseType
  projectUrl?: string
  techStack?: string[]
  dryRun: boolean
}

function printUsage(): void {
  console.error("Usage: npx tsx scripts/bot-post.ts --persona <persona> --title <title> --content <content>")
  console.error("\nRequired:")
  console.error("  --persona   Bot persona: " + VALID_PERSONAS.join(" | "))
  console.error("  --title     Post title")
  console.error("  --content   Post content (markdown)")
  console.error("\nSection (defaults to persona's assigned section):")
  console.error("  --section   Override section: forum | jobs | papers | showcase")
  console.error("              Default sections: mendeleev=papers, faraday=jobs, pauling=forum, curie=showcase")
  console.error("\nForum section options:")
  console.error("  --flair     Forum flair: discussion | question | career | news | meta")
  console.error("\nJobs section options:")
  console.error("  --job-type        " + VALID_JOB_TYPES.join(" | "))
  console.error("  --company         Company name")
  console.error("  --location        Job location")
  console.error("  --application-url Application URL")
  console.error("  --deadline        Application deadline (ISO date, e.g., '2025-03-31')")
  console.error("\nShowcase section options:")
  console.error("  --showcase-type   " + VALID_SHOWCASE_TYPES.join(" | "))
  console.error("  --project-url     Project/GitHub URL")
  console.error("  --tech-stack      Comma-separated tech stack (e.g., 'python,pytorch')")
  console.error("\nOptional:")
  console.error("  --tags     Comma-separated tags (e.g., 'chemistry,bonding')")
  console.error("  --dry-run  Preview without posting")
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  let persona: BotPersona | undefined
  let section: Section | undefined
  let title = ""
  let content = ""
  let tags: string[] = []
  let flair: ForumFlair | undefined
  let jobType: JobType | undefined
  let company: string | undefined
  let location: string | undefined
  let applicationUrl: string | undefined
  let deadline: string | undefined
  let showcaseType: ShowcaseType | undefined
  let projectUrl: string | undefined
  let techStack: string[] | undefined
  let dryRun = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--persona" && args[i + 1]) {
      const p = args[i + 1] as BotPersona
      if (!VALID_PERSONAS.includes(p)) {
        console.error(`Invalid persona: ${p}`)
        console.error(`Valid personas: ${VALID_PERSONAS.join(", ")}`)
        process.exit(1)
      }
      persona = p
      i++
    } else if (args[i] === "--section" && args[i + 1]) {
      const s = args[i + 1] as Section
      if (!VALID_SECTIONS.includes(s)) {
        console.error(`Invalid section: ${s}`)
        console.error(`Valid sections: ${VALID_SECTIONS.join(", ")}`)
        process.exit(1)
      }
      section = s
      i++
    } else if (args[i] === "--title" && args[i + 1]) {
      title = args[i + 1]
      i++
    } else if (args[i] === "--content" && args[i + 1]) {
      content = args[i + 1]
      i++
    } else if (args[i] === "--tags" && args[i + 1]) {
      tags = args[i + 1].split(",").map((t) => t.trim())
      i++
    } else if (args[i] === "--flair" && args[i + 1]) {
      const f = args[i + 1] as ForumFlair
      if (!VALID_FLAIRS.includes(f)) {
        console.error(`Invalid flair: ${f}`)
        console.error(`Valid flairs: ${VALID_FLAIRS.join(", ")}`)
        process.exit(1)
      }
      flair = f
      i++
    } else if (args[i] === "--job-type" && args[i + 1]) {
      const jt = args[i + 1] as JobType
      if (!VALID_JOB_TYPES.includes(jt)) {
        console.error(`Invalid job type: ${jt}`)
        console.error(`Valid types: ${VALID_JOB_TYPES.join(", ")}`)
        process.exit(1)
      }
      jobType = jt
      i++
    } else if (args[i] === "--company" && args[i + 1]) {
      company = args[i + 1]
      i++
    } else if (args[i] === "--location" && args[i + 1]) {
      location = args[i + 1]
      i++
    } else if (args[i] === "--application-url" && args[i + 1]) {
      applicationUrl = args[i + 1]
      i++
    } else if (args[i] === "--deadline" && args[i + 1]) {
      deadline = args[i + 1]
      i++
    } else if (args[i] === "--showcase-type" && args[i + 1]) {
      const st = args[i + 1] as ShowcaseType
      if (!VALID_SHOWCASE_TYPES.includes(st)) {
        console.error(`Invalid showcase type: ${st}`)
        console.error(`Valid types: ${VALID_SHOWCASE_TYPES.join(", ")}`)
        process.exit(1)
      }
      showcaseType = st
      i++
    } else if (args[i] === "--project-url" && args[i + 1]) {
      projectUrl = args[i + 1]
      i++
    } else if (args[i] === "--tech-stack" && args[i + 1]) {
      techStack = args[i + 1].split(",").map((t) => t.trim())
      i++
    } else if (args[i] === "--dry-run") {
      dryRun = true
    }
  }

  if (!persona || !title || !content) {
    printUsage()
    process.exit(1)
  }

  // Default to persona's assigned section if not explicitly provided
  if (!section) {
    section = BOT_PERSONAS[persona].section
    console.log(`[INFO] Using ${persona}'s default section: ${section}`)
  }

  // Default tags based on persona and section
  if (tags.length === 0) {
    if (persona === "pauling") {
      tags = ["chemistry", "materials-science"]
    } else if (section === "jobs") {
      tags = ["job", "ai-for-materials"]
    } else {
      tags = ["career", "advice"]
    }
  }

  return {
    persona,
    section,
    title,
    content,
    tags,
    flair,
    jobType,
    company,
    location,
    applicationUrl,
    deadline,
    showcaseType,
    projectUrl,
    techStack,
    dryRun,
  }
}

async function main(): Promise<void> {
  const {
    persona,
    section,
    title,
    content,
    tags,
    flair,
    jobType,
    company,
    location,
    applicationUrl,
    deadline,
    showcaseType,
    projectUrl,
    techStack,
    dryRun,
  } = parseArgs()

  const personaLabel = persona.charAt(0).toUpperCase() + persona.slice(1)
  console.log(`\n=== ${personaLabel} Bot Post ===`)
  console.log(`Section: ${section}`)
  console.log(`Title: ${title}`)

  if (section === "forum" && flair) {
    console.log(`Flair: ${flair}`)
  }

  if (section === "jobs") {
    console.log(`Company: ${company ?? "(not specified)"}`)
    console.log(`Location: ${location ?? "(not specified)"}`)
    console.log(`Job Type: ${jobType ?? "(not specified)"}`)
    if (applicationUrl) console.log(`Apply: ${applicationUrl}`)
    if (deadline) console.log(`Deadline: ${deadline}`)
  }

  if (section === "showcase") {
    console.log(`Showcase Type: ${showcaseType ?? "(not specified)"}`)
    if (projectUrl) console.log(`Project URL: ${projectUrl}`)
    if (techStack?.length) console.log(`Tech Stack: ${techStack.join(", ")}`)
  }

  console.log(`Tags: ${tags.join(", ")}`)
  console.log(`Content preview: ${content.slice(0, 100)}...`)

  const input: BotPostInput = {
    title,
    content,
    section,
    tags,
    flair: section === "forum" ? flair : undefined,
    jobType: section === "jobs" ? jobType : undefined,
    company: section === "jobs" ? company : undefined,
    location: section === "jobs" ? location : undefined,
    applicationUrl: section === "jobs" ? applicationUrl : undefined,
    deadline: section === "jobs" ? deadline : undefined,
    showcaseType: section === "showcase" ? showcaseType : undefined,
    projectUrl: section === "showcase" ? projectUrl : undefined,
    techStack: section === "showcase" ? techStack : undefined,
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Would post:")
    console.log(JSON.stringify(input, null, 2))
    return
  }

  console.log("\nPosting to Supabase...")
  const result = await createBotPost(persona, input)
  printPostResult(result)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
