import { type Address, decodeAbiParameters, type Hex, hexToBigInt } from 'viem'
import type { TracerCache } from '../cache'
import { PANIC_MAP } from './decoder'

type KV = Record<string, string>
export type PrecompilePretty = {
  name: string
  inputText: string
  outputText?: string
}

export const toAddr = (n: number): Address => `0x${n.toString(16).padStart(40, '0')}` as Address

export function hs(hex: Hex | string, startBytes: number, byteLen: number): Hex {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const s = startBytes * 2
  const e = s + byteLen * 2
  return `0x${h.slice(s, e)}` as Hex
}

export function hexLenBytes(hex?: Hex): number {
  if (!hex) return 0
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  return Math.ceil(h.length / 2)
}

export function trunc(hex: Hex | string | undefined, max = 32): string {
  if (!hex) return '0x'
  const h = typeof hex === 'string' ? hex : String(hex)
  const s = h.length <= 2 + max ? h : `${h.slice(0, 2 + max)}…`
  return s
}

export function kvList(obj: KV): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(obj)) parts.push(`${k}: ${v}`)
  return parts.join(', ')
}

export function tryDecodePretty(spec: string[], data?: Hex): string | undefined {
  if (!data || data === '0x') return undefined
  try {
    const params = spec.map((s) => {
      const i = s.indexOf(' ')
      if (i === -1) return { type: s } as const
      return { type: s.slice(0, i), name: s.slice(i + 1) } as const
    })
    const values = decodeAbiParameters(params as any, data) as unknown[]
    const out: KV = {}
    for (let i = 0; i < params.length; i++) {
      const name = (params[i] as any).name ?? String(i)
      let val = values[i] as any
      if (typeof val === 'bigint') val = val.toString()
      if (typeof val === 'string') val = trunc(val)
      out[name] = String(val)
    }
    return kvList(out)
  } catch {
    return `data: ${trunc(data)}`
  }
}

export function parseModExpInput(input: Hex) {
  const baseLen = hexToBigInt(hs(input, 0, 32))
  const expLen = hexToBigInt(hs(input, 32, 32))
  const modLen = hexToBigInt(hs(input, 64, 32))
  const start = 96
  const base = hs(input, start, Number(baseLen))
  const exp = hs(input, start + Number(baseLen), Number(expLen))
  const mod = hs(input, start + Number(baseLen) + Number(expLen), Number(modLen))
  return { baseLen, expLen, modLen, base, exp, mod }
}

/** EIP-197 pairing input parser: 6 words per pair */
export function parsePairingInput(input: Hex) {
  const data = input.startsWith('0x') ? input.slice(2) : input
  const words: string[] = []
  for (let i = 0; i + 64 <= data.length; i += 64) words.push(data.slice(i, i + 64))
  const pairs: {
    x1: Hex
    y1: Hex
    x2_c0: Hex
    x2_c1: Hex
    y2_c0: Hex
    y2_c1: Hex
  }[] = []
  for (let i = 0; i + 6 <= words.length; i += 6) {
    pairs.push({
      x1: `0x${words[i + 0]}`,
      y1: `0x${words[i + 1]}`,
      x2_c0: `0x${words[i + 2]}`,
      x2_c1: `0x${words[i + 3]}`,
      y2_c0: `0x${words[i + 4]}`,
      y2_c1: `0x${words[i + 5]}`,
    })
  }
  const consumed = pairs.length * 6 * 32
  const total = hexLenBytes(input)
  const leftover = total - consumed
  return { pairs, leftover }
}
export type FourByteEntry = {
  id: number
  text_signature: string
  created_at: string
}

export function nameFromSelector(input: Hex | undefined, cache: TracerCache): string | undefined {
  if (!input || input.length < 10) return undefined
  const sel = input.slice(0, 10) as Hex
  const fn = cache.fourByteDir.get(sel)
  if (!fn) return undefined
  const sig = `${fn.name}(${(fn.inputs ?? []).map((i) => i.type).join(',')})`
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

export function tryDecodeErrorString(data?: Hex): string | null {
  if (!data || data === '0x') return null
  // Error(string) selector
  if (data.slice(0, 10).toLowerCase() !== '0x08c379a0') return null
  try {
    const [reason] = decodeAbiParameters([{ type: 'string' }], `0x${data.slice(10)}` as Hex)
    return `Error(${JSON.stringify(reason)})`
  } catch {
    return null
  }
}

export function tryDecodePanic(data?: Hex): string | null {
  if (!data || data === '0x') return null
  if (data.slice(0, 10).toLowerCase() !== '0x4e487b71') return null
  try {
    const [codeBn] = decodeAbiParameters([{ type: 'uint256' }], `0x${data.slice(10)}` as Hex)
    const code = Number(codeBn)
    const msg = PANIC_MAP[code] ?? 'panic'
    return `Panic(0x${code.toString(16)}: ${msg})`
  } catch {
    return null
  }
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
