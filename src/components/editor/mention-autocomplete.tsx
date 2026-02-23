"use client"

import { useMemo, useState, useEffect, useCallback, useRef, type KeyboardEvent } from "react"

import { type BotConfig } from "@/lib/bots"
import { findActiveMentionQuery, insertMention, getBotSuggestions, type ActiveMentionQuery } from "@/lib/mentions"
import { BotAvatar } from "@/components/user/bot-avatar"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type MentionAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  className?: string
}

export function MentionAutocomplete({ value, onChange, textareaRef, className }: MentionAutocompleteProps) {
  const [activeQuery, setActiveQuery] = useState<ActiveMentionQuery | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const popoverRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => (activeQuery ? getBotSuggestions(activeQuery.query) : []), [activeQuery])

  useEffect(() => {
    if (!textareaRef.current) return

    const handleSelectionChange = () => {
      const textarea = textareaRef.current
      if (!textarea) return

      const cursorIndex = textarea.selectionStart
      setCursorPosition(cursorIndex)

      const query = findActiveMentionQuery(value, cursorIndex)
      setActiveQuery(query)
      if (query) {
        setSelectedIndex(0)
      }
    }

    const textarea = textareaRef.current
    textarea.addEventListener("selectionchange", handleSelectionChange)
    textarea.addEventListener("click", handleSelectionChange)
    textarea.addEventListener("keyup", handleSelectionChange)

    return () => {
      textarea.removeEventListener("selectionchange", handleSelectionChange)
      textarea.removeEventListener("click", handleSelectionChange)
      textarea.removeEventListener("keyup", handleSelectionChange)
    }
  }, [value, textareaRef])

  const selectBot = useCallback(
    (bot: BotConfig) => {
      if (!activeQuery || !textareaRef.current) return

      const newValue = insertMention(value, activeQuery, bot.username)
      onChange(newValue)

      const newCursorPos = activeQuery.startIndex + bot.username.length + 2
      setActiveQuery(null)

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      })
    },
    [activeQuery, value, onChange, textareaRef],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!activeQuery || suggestions.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % suggestions.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case "Tab":
        case "Enter":
          if (suggestions[selectedIndex]) {
            e.preventDefault()
            selectBot(suggestions[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          setActiveQuery(null)
          break
      }
    },
    [activeQuery, suggestions, selectedIndex, selectBot],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const originalOnKeyDown = textarea.onkeydown
    textarea.onkeydown = handleKeyDown as unknown as typeof textarea.onkeydown

    return () => {
      textarea.onkeydown = originalOnKeyDown
    }
  }, [handleKeyDown, textareaRef])

  if (!activeQuery || suggestions.length === 0) {
    return null
  }

  return (
    <Popover open={true} onOpenChange={(open) => !open && setActiveQuery(null)}>
      <PopoverAnchor asChild>
        <div className="absolute" style={{ top: cursorPosition }} />
      </PopoverAnchor>
      <PopoverContent
        ref={popoverRef}
        className={cn("w-72 p-1", className)}
        align="start"
        side="bottom"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
        data-testid="mention-autocomplete"
      >
        <div className="text-muted-foreground px-2 py-1 text-xs font-medium">Mention a bot</div>
        {suggestions.map((bot, index) => (
          <button
            key={bot.key}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
            )}
            onClick={() => selectBot(bot)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <BotAvatar seed={bot.displayName} size={24} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{bot.displayName}</div>
              <div className="text-muted-foreground truncate text-xs">@{bot.username}</div>
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
