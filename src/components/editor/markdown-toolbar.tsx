"use client"

import { useEffect } from "react"
import { Bold, Italic, Heading2, Code, SquareCode, Link2, Image, List, ListOrdered, Quote, Sigma } from "lucide-react"

import { useMarkdownFormat } from "@/hooks/use-markdown-format"
import type { FormatType } from "@/hooks/use-markdown-format"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type MarkdownToolbarProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onValueChange: (value: string) => void
  variant?: "full" | "compact"
}

type ButtonConfig = {
  format: FormatType
  icon: typeof Bold
  label: string
  shortcut?: string
  testId: string
}

const fullButtons: ButtonConfig[] = [
  { format: "bold", icon: Bold, label: "Bold", shortcut: "Cmd+B", testId: "toolbar-bold" },
  { format: "italic", icon: Italic, label: "Italic", shortcut: "Cmd+I", testId: "toolbar-italic" },
  { format: "heading", icon: Heading2, label: "Heading", testId: "toolbar-heading" },
  { format: "code", icon: Code, label: "Code", shortcut: "Cmd+E", testId: "toolbar-code" },
  { format: "codeBlock", icon: SquareCode, label: "Code Block", testId: "toolbar-code-block" },
  { format: "link", icon: Link2, label: "Link", shortcut: "Cmd+K", testId: "toolbar-link" },
  { format: "image", icon: Image, label: "Image", testId: "toolbar-image" },
  { format: "bulletList", icon: List, label: "Bullet List", testId: "toolbar-bullet-list" },
  { format: "numberedList", icon: ListOrdered, label: "Numbered List", testId: "toolbar-numbered-list" },
  { format: "quote", icon: Quote, label: "Quote", testId: "toolbar-quote" },
  { format: "inlineMath", icon: Sigma, label: "Math", shortcut: "Cmd+Shift+M", testId: "toolbar-math" },
]

const compactButtons: ButtonConfig[] = [
  { format: "bold", icon: Bold, label: "Bold", shortcut: "Cmd+B", testId: "toolbar-bold" },
  { format: "italic", icon: Italic, label: "Italic", shortcut: "Cmd+I", testId: "toolbar-italic" },
  { format: "code", icon: Code, label: "Code", shortcut: "Cmd+E", testId: "toolbar-code" },
  { format: "link", icon: Link2, label: "Link", shortcut: "Cmd+K", testId: "toolbar-link" },
  { format: "quote", icon: Quote, label: "Quote", testId: "toolbar-quote" },
  { format: "inlineMath", icon: Sigma, label: "Math", shortcut: "Cmd+Shift+M", testId: "toolbar-math" },
]

export function MarkdownToolbar({ textareaRef, value, onValueChange, variant = "full" }: MarkdownToolbarProps) {
  const { applyFormat, shortcutMap } = useMarkdownFormat(textareaRef, value, onValueChange)
  const buttons = variant === "full" ? fullButtons : compactButtons

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      const key = e.key.toLowerCase()
      const shortcutKey = e.shiftKey ? `mod+shift+${key}` : `mod+${key}`
      const format = shortcutMap[shortcutKey]

      if (format) {
        e.preventDefault()
        applyFormat(format)
      }
    }

    textarea.addEventListener("keydown", handleKeyDown)
    return () => textarea.removeEventListener("keydown", handleKeyDown)
  }, [textareaRef, applyFormat, shortcutMap])

  return (
    <TooltipProvider>
      <div
        data-testid="markdown-toolbar"
        className="scrollbar-hide border-border flex gap-1 overflow-x-auto border-b p-1 md:flex-wrap md:overflow-visible"
      >
        {buttons.map(({ format, icon: Icon, label, shortcut, testId }) => (
          <Tooltip key={format}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormat(format)}
                className="min-h-11 min-w-11 md:min-w-auto"
                data-testid={testId}
                aria-label={label}
              >
                <Icon className="size-4" />
                <span className="sr-only">{label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {label} {shortcut && <span className="text-muted-foreground">({shortcut})</span>}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
