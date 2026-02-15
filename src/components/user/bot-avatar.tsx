import { BOT_PERSONAS } from "@/lib/bots"

type BotAvatarProps = {
  seed: string
  size?: number
}

// Fallback colors for unknown bots (hash-based selection)
const FALLBACK_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#ec4899", // pink
  "#38bdf8", // light-blue
  "#2dd4bf", // teal
]

// Build color map from central bot config
const BOT_COLORS: Record<string, string> = Object.fromEntries(
  Object.values(BOT_PERSONAS).map((bot) => [bot.displayName, bot.color])
)

function hashString(value: string): number {
  let hash = 2166136261

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return hash >>> 0
}

function pick<T>(arr: T[], hash: number, offset: number): T {
  return arr[((hash >>> offset) ^ (hash >>> (offset + 8))) % arr.length]
}

function renderEyes(style: number): React.ReactNode {
  const pupilColor = "#1e293b"
  switch (style) {
    case 0:
      // Round eyes
      return (
        <>
          <circle cx="22" cy="30" r="5" fill="white" />
          <circle cx="22" cy="30" r="2.5" fill={pupilColor} />
          <circle cx="42" cy="30" r="5" fill="white" />
          <circle cx="42" cy="30" r="2.5" fill={pupilColor} />
        </>
      )
    case 1:
      // Square eyes
      return (
        <>
          <rect x="17" y="25" width="10" height="10" rx="1.5" fill="white" />
          <circle cx="22" cy="30" r="2.5" fill={pupilColor} />
          <rect x="37" y="25" width="10" height="10" rx="1.5" fill="white" />
          <circle cx="42" cy="30" r="2.5" fill={pupilColor} />
        </>
      )
    default:
      // Dot eyes
      return (
        <>
          <circle cx="22" cy="30" r="3" fill="white" />
          <circle cx="42" cy="30" r="3" fill="white" />
        </>
      )
  }
}

function renderMouth(style: number): React.ReactNode {
  switch (style) {
    case 0:
      // Grid teeth
      return (
        <>
          <rect x="20" y="40" width="24" height="8" rx="2" fill="white" />
          <line x1="28" y1="40" x2="28" y2="48" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="36" y1="40" x2="36" y2="48" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="20" y1="44" x2="44" y2="44" stroke="#1e293b" strokeWidth="1.5" />
        </>
      )
    case 1:
      // Wide smile (arc)
      return (
        <path
          d="M20 42 Q32 52 44 42"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )
    default:
      // Straight line
      return (
        <line
          x1="20" y1="44" x2="44" y2="44"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )
  }
}

function renderAntenna(style: number, faceColor: string): React.ReactNode {
  switch (style) {
    case 0:
      // Ball antenna
      return (
        <>
          <line x1="32" y1="14" x2="32" y2="6" stroke={faceColor} strokeWidth="2.5" />
          <circle cx="32" cy="5" r="3" fill={faceColor} />
        </>
      )
    case 1:
      // Lightning bolt
      return (
        <path
          d="M30 14 L28 9 L33 10 L31 4"
          fill="none"
          stroke={faceColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    default:
      // Flat antenna
      return (
        <>
          <line x1="32" y1="14" x2="32" y2="8" stroke={faceColor} strokeWidth="2.5" />
          <line x1="27" y1="8" x2="37" y2="8" stroke={faceColor} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )
  }
}

function renderEars(hasEars: boolean, earStyle: number, faceColor: string): React.ReactNode {
  if (!hasEars) return null
  if (earStyle === 0) {
    // Round ears
    return (
      <>
        <circle cx="10" cy="32" r="4" fill={faceColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        <circle cx="54" cy="32" r="4" fill={faceColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      </>
    )
  }
  // Square ears
  return (
    <>
      <rect x="7" y="28" width="7" height="8" rx="1.5" fill={faceColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <rect x="50" y="28" width="7" height="8" rx="1.5" fill={faceColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
    </>
  )
}

export function BotAvatar({ seed, size = 32 }: BotAvatarProps) {
  const hash = hashString(seed)

  // Use bot-specific color from config, otherwise fallback to hash-based
  const faceColor = BOT_COLORS[seed] ?? pick(FALLBACK_COLORS, hash, 0)
  const eyeStyle = ((hash >>> 3) ^ (hash >>> 11)) % 3
  const mouthStyle = ((hash >>> 5) ^ (hash >>> 13)) % 3
  const antennaStyle = ((hash >>> 7) ^ (hash >>> 15)) % 3
  const hasEars = ((hash >>> 9) ^ (hash >>> 17)) % 2 === 0
  const earStyle = ((hash >>> 10) ^ (hash >>> 18)) % 2

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="64" height="64" rx="32" fill="#1e293b" />

      {/* Antenna */}
      {renderAntenna(antennaStyle, faceColor)}

      {/* Ears (behind head) */}
      {renderEars(hasEars, earStyle, faceColor)}

      {/* Head */}
      <rect x="14" y="14" width="36" height="40" rx="8" fill={faceColor} />

      {/* Visor / face area */}
      <rect x="17" y="22" width="30" height="18" rx="4" fill="rgba(0,0,0,0.2)" />

      {/* Eyes */}
      {renderEyes(eyeStyle)}

      {/* Mouth */}
      {renderMouth(mouthStyle)}
    </svg>
  )
}
