"use client"

import { useEffect, useState } from "react"

type MentionDropdownProps = {
  botUsername: string
  botColor: string
  botLabel: string
  onSelect: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  cursorPosition: number
}

/** Measure caret pixel position inside a textarea using a mirror div. */
function getCaretCoordinates(textarea: HTMLTextAreaElement, position: number): { top: number; left: number } {
  const mirror = document.createElement("div")
  const computed = window.getComputedStyle(textarea)

  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.overflow = "hidden"
  mirror.style.whiteSpace = "pre-wrap"
  mirror.style.wordWrap = "break-word"
  mirror.style.width = computed.width
  mirror.style.fontFamily = computed.fontFamily
  mirror.style.fontSize = computed.fontSize
  mirror.style.fontWeight = computed.fontWeight
  mirror.style.lineHeight = computed.lineHeight
  mirror.style.letterSpacing = computed.letterSpacing
  mirror.style.paddingTop = computed.paddingTop
  mirror.style.paddingRight = computed.paddingRight
  mirror.style.paddingBottom = computed.paddingBottom
  mirror.style.paddingLeft = computed.paddingLeft
  mirror.style.borderWidth = computed.borderWidth
  mirror.style.borderStyle = computed.borderStyle
  mirror.style.boxSizing = computed.boxSizing
  mirror.style.tabSize = computed.tabSize

  const textBefore = textarea.value.substring(0, position)
  mirror.textContent = textBefore

  const marker = document.createElement("span")
  marker.textContent = "\u200b"
  mirror.appendChild(marker)

  document.body.appendChild(mirror)

  try {
    const lineHeight = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.2
    const top = marker.offsetTop + lineHeight - textarea.scrollTop
    const left = marker.offsetLeft
    return { top, left }
  } finally {
    document.body.removeChild(mirror)
  }
}

export function MentionDropdown({
  botUsername,
  botColor,
  botLabel,
  onSelect,
  textareaRef,
  cursorPosition,
}: MentionDropdownProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    setPosition(getCaretCoordinates(textarea, cursorPosition))
  }, [textareaRef, cursorPosition])

  return (
    <div
      role="listbox"
      className="bg-popover border-border absolute z-50 w-56 rounded-md border p-1 shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        role="option"
        aria-selected
        className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
        onMouseDown={(e) => {
          e.preventDefault()
          onSelect()
        }}
      >
        <span
          className="mt-0.5 h-2.5 w-2.5 shrink-0 self-start rounded-full"
          style={{ backgroundColor: botColor }}
        />
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-medium">@{botUsername}</span>
          <span className="text-muted-foreground text-xs">{botLabel}</span>
        </div>
      </button>
    </div>
  )
}
