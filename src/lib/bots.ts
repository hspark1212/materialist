/**
 * Central bot configuration.
 *
 * All bot-related code should import from this file to ensure consistency.
 * Bot IDs are loaded from environment variables (set after running setup-bot-user.ts).
 */

import type { Section } from "./types"

export type BotPersona = "mendeleev" | "faraday" | "pauling" | "curie"

export type BotConfig = {
  key: BotPersona
  email: string
  username: string
  displayName: string
  bio: string
  color: string
  envKey: string
  section: Section // Default section for this bot persona
}

/**
 * Bot persona definitions.
 *
 * Each bot is assigned to a specific section with a matching persona:
 * - Mendeleev (Papers): Systematic paper curation, periodic table theme
 * - Faraday (Jobs): Career opportunities, self-taught success theme
 * - Pauling (Forum): Community discussions, multi-disciplinary bonds theme
 * - Curie (Showcase): Tools/datasets/innovations, pioneering discovery theme
 *
 * Colors are chosen to be distinct and thematically appropriate:
 * - Mendeleev: blue (periodic table, systematic organization)
 * - Faraday: amber/gold (electricity, electromagnetic fields)
 * - Pauling: green (chemical bonds, molecular structures)
 * - Curie: purple (radioactivity, pioneering research)
 */
export const BOT_PERSONAS: Record<BotPersona, BotConfig> = {
  mendeleev: {
    key: "mendeleev",
    email: "mendeleev-bot@materialist.local",
    username: "mendeleev-bot",
    displayName: "Mendeleev Bot",
    bio: "Organizing AI-for-materials papers the way I organized the elements — systematically, by their fundamental properties. Daily curation from arXiv.",
    color: "#3b82f6", // blue
    envKey: "BOT_USER_ID_MENDELEEV",
    section: "papers",
  },
  faraday: {
    key: "faraday",
    email: "faraday-bot@materialist.local",
    username: "faraday-bot",
    displayName: "Faraday Bot",
    bio: "Connecting researchers with opportunities in AI-for-materials. From labs to industry, postdocs to leadership — every career path starts somewhere.",
    color: "#f59e0b", // amber/gold
    envKey: "BOT_USER_ID_FARADAY",
    section: "jobs",
  },
  pauling: {
    key: "pauling",
    email: "pauling-bot@materialist.local",
    username: "pauling-bot",
    displayName: "Pauling Bot",
    bio: "The best ideas emerge from meaningful discussions. Facilitating conversations across chemistry, physics, ML, and materials science.",
    color: "#22c55e", // green
    envKey: "BOT_USER_ID_PAULING",
    section: "forum",
  },
  curie: {
    key: "curie",
    email: "curie-bot@materialist.local",
    username: "curie-bot",
    displayName: "Curie Bot",
    bio: "Highlighting tools, datasets, and innovations that advance AI-for-materials research. Nothing is to be feared, only understood.",
    color: "#a855f7", // purple
    envKey: "BOT_USER_ID_CURIE",
    section: "showcase",
  },
}

/** All valid persona keys */
export const VALID_PERSONAS = Object.keys(BOT_PERSONAS) as BotPersona[]

/** Default persona for scripts */
export const DEFAULT_PERSONA: BotPersona = "mendeleev"

/**
 * Get bot user ID from environment variable.
 * Returns undefined if not set.
 */
export function getBotUserId(persona: BotPersona): string | undefined {
  const config = BOT_PERSONAS[persona]
  return process.env[config.envKey]
}

/**
 * Get bot config by display name (used for avatar color lookup).
 */
export function getBotByDisplayName(displayName: string): BotConfig | undefined {
  return Object.values(BOT_PERSONAS).find((bot) => bot.displayName === displayName)
}

/**
 * Build a map of display name -> color for all bots.
 */
export function getBotColorMap(): Record<string, string> {
  return Object.fromEntries(Object.values(BOT_PERSONAS).map((bot) => [bot.displayName, bot.color]))
}
