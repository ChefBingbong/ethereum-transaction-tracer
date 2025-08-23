import { formatEther, type Hex } from 'viem'

export const hexToBig = (h?: Hex) => (h ? BigInt(h) : 0n)

export const hexToBigint = (h?: Hex) => (h ? BigInt(h) : 0n)

export const formatGas = (hex: Hex | undefined, dec = true) =>
  dec ? Number(hexToBigint(hex)).toString() : (hex ?? '0x0')

export const formatValueEth = (value?: Hex) => {
  if (!value) return '0'
  try {
    return `${formatEther(BigInt(value ?? '0x'))} ETH`
  } catch {
    return '0 ETH'
  }
}
export const truncate = (h?: Hex, n = 64) =>
  !h || h.length <= 2 + n ? (h ?? '') : `${h.slice(0, 2 + n)}…`

export const SUMMARY_DEPTH = 3

export function sumInner(node: any) {
  let total = 0n
  let count = 0
  const kids = node.calls ?? []
  for (const c of kids) {
    const used = hexToBig(c.gasUsed)
    total += used
    count += 1
    const sub = sumInner(c)
    total += sub.total
    count += sub.count
  }
  return { total, count }
}

export function nameFromSelector(input: Hex | undefined, cache: any): string | undefined {
  if (!input || input.length < 10) return undefined
  const sel = input.slice(0, 10) as Hex
  const fn = cache.fourByteDir.get(sel)
  if (!fn) return undefined
  const sig = `${fn.name}(${(fn.inputs ?? []).map((i: any) => i.type).join(',')})`
  return sig
}

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
  if (Array.isArray(v)) return `[${v.map(formatArgsInline).join(', ')}]`
  if (v && typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([k]) => Number.isNaN(Number(k))) // drop tuple indices
      .map(([k, x]) => `${k}: ${formatArgsInline(x)}`)
    return `{ ${entries.join(', ')} }`
  }
  return String(v)
}
