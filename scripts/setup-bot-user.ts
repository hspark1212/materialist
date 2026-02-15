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
import {
  BOT_PERSONAS,
  DEFAULT_PERSONA,
  VALID_PERSONAS,
  type BotPersona,
} from "@/lib/bots"

// ── CLI ──

function parseArgs(): { persona: BotPersona; list: boolean } {
  const args = process.argv.slice(2)
  let persona: BotPersona = DEFAULT_PERSONA
  let list = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--persona" && args[i + 1]) {
      persona = args[i + 1] as BotPersona
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
    for (const key of VALID_PERSONAS) {
      const p = BOT_PERSONAS[key]
      const marker = key === DEFAULT_PERSONA ? " (default)" : ""
      console.log(`  ${key}${marker}`)
      console.log(`    @${p.username} — ${p.displayName}`)
      console.log(`    ${p.bio}\n`)
    }
    return
  }

  if (!VALID_PERSONAS.includes(personaKey)) {
    console.error(
      `Unknown persona: "${personaKey}"\n` +
        `Available: ${VALID_PERSONAS.join(", ")}`
    )
    process.exit(1)
  }

  const persona = BOT_PERSONAS[personaKey]
  console.log(`Setting up bot: @${persona.username} (${persona.displayName})\n`)

  const supabase = createScriptAdminClient()

  // Check if this persona's bot already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(
    (u) => u.email === persona.email
  )

  if (existing) {
    console.log(`Bot user already exists: ${existing.id}`)
    console.log(`\nAdd to .env.local:\n  ${persona.envKey}=${existing.id}`)
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
      bio: persona.bio,
      is_anonymous: false,
      is_bot: true,
      profile_completed: true,
    })
    .eq("id", userId)

  if (profileError) {
    console.error("Failed to update bot profile:", profileError.message)
    process.exit(1)
  }

  console.log(`Updated profile: @${persona.username} (${persona.displayName})`)
  console.log(`\nAdd to .env.local:\n  ${persona.envKey}=${userId}`)
}

main()
