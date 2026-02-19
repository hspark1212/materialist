import { useCallback, useMemo } from "react"

export type FormatType =
  | "bold"
  | "italic"
  | "heading"
  | "code"
  | "codeBlock"
  | "link"
  | "image"
  | "bulletList"
  | "numberedList"
  | "quote"
  | "inlineMath"
  | "displayMath"

export type ShortcutMap = Record<string, FormatType>

export function useMarkdownFormat(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: (value: string) => void,
) {
  const shortcutMap = useMemo<ShortcutMap>(
    () => ({
      "mod+b": "bold",
      "mod+i": "italic",
      "mod+k": "link",
      "mod+shift+m": "inlineMath",
      "mod+e": "code",
    }),
    [],
  )

  const applyFormat = useCallback(
    (format: FormatType) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const beforeText = value.substring(0, start)
      const afterText = value.substring(end)

      let newText = ""
      let newCursorPos = start
      let newSelectionEnd = start

      switch (format) {
        case "bold": {
          const text = selectedText || "bold text"
          newText = `${beforeText}**${text}**${afterText}`
          newCursorPos = start + 2
          newSelectionEnd = selectedText ? start + 2 + selectedText.length : start + 2 + text.length
          break
        }

        case "italic": {
          const text = selectedText || "italic text"
          newText = `${beforeText}_${text}_${afterText}`
          newCursorPos = start + 1
          newSelectionEnd = selectedText ? start + 1 + selectedText.length : start + 1 + text.length
          break
        }

        case "code": {
          const text = selectedText || "code"
          newText = `${beforeText}\`${text}\`${afterText}`
          newCursorPos = start + 1
          newSelectionEnd = selectedText ? start + 1 + selectedText.length : start + 1 + text.length
          break
        }

        case "inlineMath": {
          const text = selectedText || "E=mc^2"
          newText = `${beforeText}$${text}$${afterText}`
          newCursorPos = start + 1
          newSelectionEnd = selectedText ? start + 1 + selectedText.length : start + 1 + text.length
          break
        }

        case "link": {
          const text = selectedText || "link text"
          newText = `${beforeText}[${text}](url)${afterText}`
          newCursorPos = start + text.length + 3
          newSelectionEnd = start + text.length + 6
          break
        }

        case "image": {
          const text = selectedText || "alt text"
          newText = `${beforeText}![${text}](url)${afterText}`
          newCursorPos = start + text.length + 4
          newSelectionEnd = start + text.length + 7
          break
        }

        case "heading": {
          const lineStart = beforeText.lastIndexOf("\n") + 1
          const lineEnd = afterText.indexOf("\n")
          const line = value.substring(lineStart, lineEnd === -1 ? value.length : end + lineEnd)
          const newLine = line.startsWith("## ") ? line : `## ${line}`
          newText = value.substring(0, lineStart) + newLine + (lineEnd === -1 ? "" : value.substring(end + lineEnd))
          newCursorPos = lineStart + newLine.length
          newSelectionEnd = newCursorPos
          break
        }

        case "codeBlock": {
          if (selectedText.includes("\n") || !selectedText) {
            const text = selectedText || "code"
            newText = `${beforeText}\n\`\`\`\n${text}\n\`\`\`\n${afterText}`
            newCursorPos = start + 5
            newSelectionEnd = start + 5 + text.length
          } else {
            newText = `${beforeText}\`${selectedText}\`${afterText}`
            newCursorPos = start + 1
            newSelectionEnd = start + 1 + selectedText.length
          }
          break
        }

        case "bulletList": {
          const lines = (selectedText || "list item").split("\n")
          const formatted = lines.map((line) => (line.trim() ? `- ${line}` : line)).join("\n")
          newText = `${beforeText}${formatted}${afterText}`
          newCursorPos = start
          newSelectionEnd = start + formatted.length
          break
        }

        case "numberedList": {
          const lines = (selectedText || "list item").split("\n")
          const formatted = lines.map((line, i) => (line.trim() ? `${i + 1}. ${line}` : line)).join("\n")
          newText = `${beforeText}${formatted}${afterText}`
          newCursorPos = start
          newSelectionEnd = start + formatted.length
          break
        }

        case "quote": {
          const lines = (selectedText || "quote text").split("\n")
          const formatted = lines.map((line) => (line.trim() ? `> ${line}` : line)).join("\n")
          newText = `${beforeText}${formatted}${afterText}`
          newCursorPos = start
          newSelectionEnd = start + formatted.length
          break
        }

        case "displayMath": {
          const text = selectedText || "E = mc^2"
          newText = `${beforeText}$$\n${text}\n$$${afterText}`
          newCursorPos = start + 3
          newSelectionEnd = start + 3 + text.length
          break
        }

        default:
          return
      }

      onChange(newText)

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(newCursorPos, newSelectionEnd)
        }
      })
    },
    [textareaRef, value, onChange],
  )

  return { applyFormat, shortcutMap }
}
