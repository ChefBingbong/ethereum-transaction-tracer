import type { Hex } from 'viem'

export const truncate = (h?: Hex, n = 64) =>
  !h || h.length <= 2 + n ? (h ?? '') : `${h.slice(0, 2 + n)}…`

export const stringify = (v: unknown): string => {
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return `[${v.map(stringify).join(', ')}]`
  if (v && typeof v === 'object') {
    return `{ ${Object.entries(v)
      .filter(([k]) => Number.isNaN(Number(k)))
      .map(([k, x]) => `${k}: ${stringify(x)}`)
      .join(', ')} }`
  }
  return String(v)
}

export function formatArgsInline(v: unknown): string {
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return `${v.map(formatArgsInline).join(', ')}`
  if (v && typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([k]) => Number.isNaN(Number(k))) // drop tuple indices
      .map(([k, x]) => `${k}: ${formatArgsInline(x)}`)
    return `{ ${entries.join(', ')} }`
  }
  return String(v)
}
