"use client"

import { useMemo } from "react"

type MentionAutocompleteResult = {
  showDropdown: boolean
  insertMention: (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    onValueChange: (value: string) => void,
  ) => void
}

/**
 * Detects when the user is typing @m, @me, @men... and offers bot autocomplete
 * for the given bot username.
 */
export function useMentionAutocomplete(
  value: string,
  cursorPosition: number,
  botUsername: string,
): MentionAutocompleteResult {
  const showDropdown = useMemo(() => {
    // Find the word being typed at cursor position
    const textBeforeCursor = value.slice(0, cursorPosition)
    const atIndex = textBeforeCursor.lastIndexOf("@")

    if (atIndex === -1) return false

    // Must be at start or after whitespace
    if (atIndex > 0 && textBeforeCursor[atIndex - 1] !== " " && textBeforeCursor[atIndex - 1] !== "\n") return false

    const partial = textBeforeCursor.slice(atIndex + 1).toLowerCase()

    // Show dropdown if the partial matches the beginning of the bot username
    return botUsername.startsWith(partial) && partial !== botUsername
  }, [value, cursorPosition, botUsername])

  const insertMention = (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    onValueChange: (value: string) => void,
  ) => {
    const textBeforeCursor = value.slice(0, cursorPosition)
    const atIndex = textBeforeCursor.lastIndexOf("@")

    if (atIndex === -1) return

    const before = value.slice(0, atIndex)
    const after = value.slice(cursorPosition)
    const mention = `@${botUsername} `
    const newValue = before + mention + after

    onValueChange(newValue)

    // Move cursor to after the inserted mention
    const newCursorPos = atIndex + mention.length
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    })
  }

  return { showDropdown, insertMention }
}
