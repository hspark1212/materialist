"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib"

interface LogoTextProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
}

export function LogoText({ size = "md", className }: LogoTextProps) {
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    // Trigger initial animation after mount
    const timer = setTimeout(() => setHasAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <span
      className={cn(
        "logo-text font-mono font-bold text-primary",
        sizeClasses[size],
        className
      )}
    >
      Mater
      <span className={cn("logo-ia", hasAnimated && "logo-ia-animated")}>
        <span className="logo-ia-front">ia</span>
        <span className="logo-ia-back">ai</span>
      </span>
      list
    </span>
  )
}
