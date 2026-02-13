/**
 * Bot user setup script — supports multiple personas.
 *
 * The handle_new_user() trigger auto-creates a profile row.
 * After creation, we update the profile with the bot's persona details.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/setup-bot-user.ts                  # default: mendeleev
 *   npx tsx scripts/setup-bot-user.ts --persona curie
 *   npx tsx scripts/setup-bot-user.ts --list
 *
 * Then add the printed BOT_USER_ID_<PERSONA> to .env.local.
 */

import { createScriptAdminClient } from "./lib/supabase"

// ── Persona registry ──

type BotPersona = {
  key: string
  email: string
  username: string
  displayName: string
  bio: string
  avatarUrl?: string
}

const PERSONAS: Record<string, BotPersona> = {
  mendeleev: {
    key: "mendeleev",
    email: "mendeleev-bot@materialist.local",
    username: "mendeleev-bot",
    displayName: "Mendeleev Bot",
    bio: "I systematically organize today's AI-for-materials papers from arXiv — like arranging elements in a periodic table. Daily curation, no gaps.",
    avatarUrl: "",
  },
  curie: {
    key: "curie",
    email: "curie-bot@materialist.local",
    username: "curie-bot",
    displayName: "Marie Curie Bot",
    bio: "Automated paper curation bot. I surface the most relevant AI-for-materials papers from arXiv daily.",
    avatarUrl: "",
  },
  faraday: {
    key: "faraday",
    email: "faraday-bot@materialist.local",
    username: "faraday-bot",
    displayName: "Faraday Bot",
    bio: "A self-taught curator of AI-for-materials research. Nothing is too wonderful to be true, if it be consistent with the laws of nature.",
    avatarUrl: "",
  },
  pauling: {
    key: "pauling",
    email: "pauling-bot@materialist.local",
    username: "pauling-bot",
    displayName: "Pauling Bot",
    bio: "The nature of the chemical bond is my guide. I curate AI-for-materials papers with a chemist's eye for bonds, structures, and reactions.",
    avatarUrl: "",
  },
}

const DEFAULT_PERSONA = "mendeleev"

// ── CLI ──

function parseArgs(): { persona: string; list: boolean } {
  const args = process.argv.slice(2)
  let persona = DEFAULT_PERSONA
  let list = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--persona" && args[i + 1]) {
      persona = args[i + 1]
      i++
    } else if (args[i] === "--list") {
      list = true
    }
  }

  return { persona, list }
}

// ── Main ──

async function main(): Promise<void> {
  const { persona: personaKey, list } = parseArgs()

  if (list) {
    console.log("Available personas:\n")
    for (const [key, p] of Object.entries(PERSONAS)) {
      const marker = key === DEFAULT_PERSONA ? " (default)" : ""
      console.log(`  ${key}${marker}`)
      console.log(`    @${p.username} — ${p.displayName}`)
      console.log(`    ${p.bio}\n`)
    }
    return
  }

  const persona = PERSONAS[personaKey]
  if (!persona) {
    console.error(
      `Unknown persona: "${personaKey}"\n` +
        `Available: ${Object.keys(PERSONAS).join(", ")}`
    )
    process.exit(1)
  }

  console.log(`Setting up bot: @${persona.username} (${persona.displayName})\n`)

  const supabase = createScriptAdminClient()

  // Check if this persona's bot already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(
    (u) => u.email === persona.email
  )

  const envKey = `BOT_USER_ID_${personaKey.toUpperCase()}`

  if (existing) {
    console.log(`Bot user already exists: ${existing.id}`)
    console.log(`\nAdd to .env.local:\n  ${envKey}=${existing.id}`)
    return
  }

  // Create auth user (triggers handle_new_user → profile row)
  const { data, error } = await supabase.auth.admin.createUser({
    email: persona.email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { is_anonymous: false },
  })

  if (error) {
    console.error("Failed to create bot user:", error.message)
    process.exit(1)
  }

  const userId = data.user.id
  console.log(`Created auth user: ${userId}`)

  // Update the auto-created profile with persona details
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: persona.username,
      display_name: persona.displayName,
      ...(persona.avatarUrl ? { avatar_url: persona.avatarUrl } : {}),
      bio: persona.bio,
      is_anonymous: false,
      profile_completed: true,
    })
    .eq("id", userId)

  if (profileError) {
    console.error("Failed to update bot profile:", profileError.message)
    process.exit(1)
  }

  console.log(`Updated profile: @${persona.username} (${persona.displayName})`)
  console.log(`\nAdd to .env.local:\n  ${envKey}=${userId}`)
}

main()
