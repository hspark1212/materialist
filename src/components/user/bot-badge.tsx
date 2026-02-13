import { Bot } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function BotBadge() {
  return (
    <Badge variant="secondary" className="gap-0.5 px-1.5 py-0 text-[11px]">
      <Bot className="size-3" />
      <span>Bot</span>
    </Badge>
  )
}
