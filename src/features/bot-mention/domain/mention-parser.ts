import { getAllBotUsernames } from "@/lib/bots"

type MentionResult = {
  found: boolean
  index: number
  username: string | null
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
}

/** Build a regex that matches any section bot mention. */
function buildMentionPattern(): RegExp {
  const usernames = getAllBotUsernames()
  return new RegExp(`(?:^|\\s)@(${usernames.map(escapeRegex).join("|")})(?=[\\s.,!?;:]|$)`)
}

const MENTION_PATTERN = buildMentionPattern()

/** Detect a section bot mention in comment text. */
export function parseMentionBot(text: string): MentionResult {
  const match = MENTION_PATTERN.exec(text)
  if (!match) return { found: false, index: -1, username: null }

  // If the match starts with whitespace, the actual @ is at match.index + 1
  const index = match[0].startsWith("@") ? match.index : match.index + 1
  return { found: true, index, username: match[1] }
}
