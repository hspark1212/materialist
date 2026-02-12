import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number): string {
  if (Math.abs(value) < 1000) {
    return value.toString()
  }

  const suffixes = ["k", "m", "b"]
  const absolute = Math.abs(value)
  const tier = Math.floor(Math.log10(absolute) / 3) - 1
  const suffix = suffixes[tier] ?? "b"
  const scale = 10 ** ((tier + 1) * 3)
  const scaled = value / scale
  const rounded = Math.abs(scaled) >= 100 ? Math.round(scaled) : Number(scaled.toFixed(1))

  return `${rounded}${suffix}`
}
