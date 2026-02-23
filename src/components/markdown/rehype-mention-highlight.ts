import { visit, SKIP } from "unist-util-visit"
import type { Root, Element, Text, ElementContent } from "hast"
import { BOT_PERSONAS, getAllBotUsernames } from "@/lib/bots"

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
}

const HIGHLIGHT_PATTERN = new RegExp(
  `@(${getAllBotUsernames().map(escapeRegex).join("|")})(?=[\\s.,!?;:]|$)`,
  "g",
)

const USERNAME_TO_COLOR: Record<string, string> = Object.fromEntries(
  Object.values(BOT_PERSONAS).map((bot) => [bot.username, bot.color]),
)

export function rehypeMentionHighlight() {
  return function (tree: Root): undefined {
    visit(tree, "text", function (node: Text, index: number | undefined, parent: Element | Root | undefined) {
      if (index === undefined || !parent) return
      if (parent.type === "element" && (parent.tagName === "code" || parent.tagName === "pre")) return

      HIGHLIGHT_PATTERN.lastIndex = 0
      const matches = [...node.value.matchAll(HIGHLIGHT_PATTERN)]
      if (matches.length === 0) return

      const replacements: ElementContent[] = []
      let cursor = 0

      for (const match of matches) {
        const start = match.index ?? 0
        const username = match[1]
        const color = USERNAME_TO_COLOR[username]

        if (start > cursor) replacements.push({ type: "text", value: node.value.slice(cursor, start) })

        replacements.push({
          type: "element",
          tagName: "span",
          properties: {
            className: ["mention-chip"],
            style: `--mention-color:${color};--mention-bg:color-mix(in srgb,${color} 12%,transparent)`,
          },
          children: [{ type: "text", value: match[0] }],
        })

        cursor = start + match[0].length
      }

      if (cursor < node.value.length) replacements.push({ type: "text", value: node.value.slice(cursor) })
      ;(parent.children as ElementContent[]).splice(index, 1, ...replacements)
      return [SKIP, index + replacements.length]
    })
  }
}
