type AnonymousAvatarProps = {
  seed: string
  size?: number
}

const ELEMENTS = [
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
  "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga",
  "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb",
  "Mo", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te",
  "I", "Xe", "Cs", "Ba", "La", "Ce", "Nd", "Sm", "Eu", "Gd",
  "Tb", "Dy", "Ho", "Er", "Yb", "Lu", "Hf", "Ta", "W", "Re",
  "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Th", "U",
]

function hashString(value: string): number {
  let hash = 2166136261

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return hash >>> 0
}

function getElement(seed: string): string {
  return ELEMENTS[hashString(seed) % ELEMENTS.length]
}

function hashToHSL(hash: number): [number, string] {
  const h = hash % 360
  const s = 55 + (((hash / 360) | 0) % 26)       // 55–80%
  const l = 45 + (((hash / 9360) | 0) % 21)      // 45–65%
  return [h, `hsl(${h}, ${s}%, ${l}%)`]
}

function getGradient(seed: string): [string, string, number] {
  const hash = hashString(seed)
  const [h1, color1] = hashToHSL(hash)
  const hash2 = hash * 7 + 3
  const [h2, color2Initial] = hashToHSL(hash2)
  let color2 = color2Initial
  if (Math.abs(h1 - h2) < 40 || Math.abs(h1 - h2) > 320) {
    const adjustedH = (h2 + 120) % 360
    const s = 55 + (((hash2 / 360) | 0) % 26)
    const l = 45 + (((hash2 / 9360) | 0) % 21)
    color2 = `hsl(${adjustedH}, ${s}%, ${l}%)`
  }
  const angle = (hash * 13) % 360
  return [color1, color2, angle]
}

export function AnonymousAvatar({ seed, size = 32 }: AnonymousAvatarProps) {
  const element = getElement(seed)
  const fontSize = element.length === 1 ? size * 0.48 : size * 0.38
  const [color1, color2, angle] = getGradient(seed)

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 700,
          color: "white",
          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {element}
      </span>
    </div>
  )
}
