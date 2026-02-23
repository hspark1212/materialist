/**
 * Mention parsing utilities for bot @mentions.
 *
 * Users can @mention bots like @materialist-bot, @mendeleev-bot, etc.
 * These utilities extract and process mentions from text content.
 */

import { BOT_PERSONAS, type BotPersona, type BotConfig } from "./bots"

export type Mention = {
  username: string // e.g., "materialist-bot"
  start: number // Character index where @ appears
  end: number // Character index after username
}

export type BotMention = {
  botKey: BotPersona
  username: string
  config: BotConfig
}

/**
 * Regex pattern for matching @mentions.
 * Matches @ followed by word characters (letters, numbers, hyphens, underscores).
 * Minimum 2 characters after @ to avoid false positives.
 */
const MENTION_REGEX = /@([a-zA-Z0-9_-]{2,32})/g

/**
 * Regex to detect if we're inside a code block (backticks or code fence).
 */
const CODE_BLOCK_REGEX = /`[^`]*`|```[\s\S]*?```/g

/**
 * Extract all @mentions from text.
 * Ignores mentions inside code blocks.
 *
 * @param text - The text to parse
 * @returns Array of Mention objects with username and positions
 */
export function extractMentions(text: string): Mention[] {
  const mentions: Mention[] = []

  // Find all code block ranges to exclude
  const codeBlockRanges: Array<[number, number]> = []
  let match: RegExpExecArray | null
  while ((match = CODE_BLOCK_REGEX.exec(text)) !== null) {
    codeBlockRanges.push([match.index, match.index + match[0].length])
  }

  // Check if a position is inside a code block
  const isInCodeBlock = (pos: number): boolean => {
    return codeBlockRanges.some(([start, end]) => pos >= start && pos < end)
  }

  // Reset regex
  MENTION_REGEX.lastIndex = 0

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const start = match.index
    const end = match.index + match[0].length

    // Skip if inside code block
    if (isInCodeBlock(start)) {
      continue
    }

    // Skip email-like patterns (preceded by word character)
    if (start > 0 && /\w/.test(text[start - 1])) {
      continue
    }

    mentions.push({
      username: match[1],
      start,
      end,
    })
  }

  return mentions
}

/**
 * Valid bot usernames extracted from BOT_PERSONAS.
 */
export const BOT_USERNAMES = Object.values(BOT_PERSONAS).map((bot) => bot.username)

/**
 * Username to BotConfig lookup map.
 */
const USERNAME_TO_BOT: Record<string, BotConfig> = Object.fromEntries(
  Object.values(BOT_PERSONAS).map((bot) => [bot.username, bot])
)

/**
 * Extract only bot mentions from text.
 * Filters mentions to only include known bot usernames.
 * Deduplicates and caps the number of mentions.
 *
 * @param text - The text to parse
 * @param maxMentions - Maximum number of bot mentions to return (default: 2)
 * @returns Array of BotMention objects with bot key and config
 */
export function extractBotMentions(text: string, maxMentions = 2): BotMention[] {
  const mentions = extractMentions(text)
  const seen = new Set<string>()
  const botMentions: BotMention[] = []

  for (const mention of mentions) {
    // Normalize username to lowercase for matching
    const normalizedUsername = mention.username.toLowerCase()
    const botConfig = USERNAME_TO_BOT[normalizedUsername]

    if (botConfig && !seen.has(botConfig.key)) {
      seen.add(botConfig.key)
      botMentions.push({
        botKey: botConfig.key,
        username: botConfig.username,
        config: botConfig,
      })

      if (botMentions.length >= maxMentions) {
        break
      }
    }
  }

  return botMentions
}

/**
 * Check if text contains any bot mentions.
 *
 * @param text - The text to check
 * @returns true if any bot is mentioned
 */
export function hasBotMention(text: string): boolean {
  return extractBotMentions(text, 1).length > 0
}

/**
 * Active mention query for autocomplete.
 * Represents the current @mention being typed.
 */
export type ActiveMentionQuery = {
  query: string // Text after @ (empty string if just "@")
  startIndex: number // Position of @ character
  endIndex: number // Current cursor position
}

/**
 * Find the active mention query at cursor position.
 * Used for autocomplete to show bot suggestions.
 *
 * @param text - The full text content
 * @param cursorIndex - Current cursor position
 * @returns ActiveMentionQuery if cursor is inside a mention, null otherwise
 */
export function findActiveMentionQuery(text: string, cursorIndex: number): ActiveMentionQuery | null {
  // Find the last @ before the cursor
  let atIndex = -1
  for (let i = cursorIndex - 1; i >= 0; i--) {
    if (text[i] === "@") {
      // Check if preceded by whitespace or start of text
      if (i === 0 || /\s/.test(text[i - 1])) {
        atIndex = i
        break
      }
    } else if (/\s/.test(text[i])) {
      // Hit whitespace before finding @ - no active mention
      break
    }
  }

  if (atIndex === -1) {
    return null
  }

  // Extract the text between @ and cursor
  const query = text.slice(atIndex + 1, cursorIndex)

  // If there's a space in the query, it's not a valid mention anymore
  if (query.includes(" ") || query.includes("\n")) {
    return null
  }

  return {
    query: query.toLowerCase(),
    startIndex: atIndex,
    endIndex: cursorIndex,
  }
}

/**
 * Insert a mention at the specified position.
 * Replaces the partial mention with the full @username.
 *
 * @param text - Original text
 * @param mention - The mention query to replace
 * @param username - The full username to insert (without @)
 * @returns New text with mention inserted
 */
export function insertMention(text: string, mention: ActiveMentionQuery, username: string): string {
  const before = text.slice(0, mention.startIndex)
  const after = text.slice(mention.endIndex)
  // Insert @username followed by a space for easy continuation
  return `${before}@${username} ${after}`
}

/**
 * Get all bot configs for autocomplete suggestions.
 * Optionally filter by query string.
 *
 * @param query - Optional filter query (matches username or displayName)
 * @returns Array of bot configs
 */
export function getBotSuggestions(query?: string): BotConfig[] {
  const bots = Object.values(BOT_PERSONAS)

  if (!query) {
    return bots
  }

  const lowerQuery = query.toLowerCase()
  return bots.filter(
    (bot) =>
      bot.username.toLowerCase().includes(lowerQuery) || bot.displayName.toLowerCase().includes(lowerQuery)
  )
}
