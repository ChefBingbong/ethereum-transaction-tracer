import { decodeAbiParameters, type Hex } from 'viem'
import type { TracerCache } from '../cache'
import { PANIC_MAP } from './decoder'

export type FourByteEntry = {
  id: number
  text_signature: string
  created_at: string
}

export function nameFromSelector(
  input: Hex | undefined,
  cache: TracerCache,
): string | undefined {
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

export async function fetch4byte(selector: string): Promise<FourByteEntry[]> {
  const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`4byte.directory HTTP ${res.status}`)
  const json = (await res.json()) as { results: FourByteEntry[] }
  return json.results ?? []
}

export function tryDecodeErrorString(data?: Hex): string | null {
  if (!data || data === '0x') return null
  // Error(string) selector
  if (data.slice(0, 10).toLowerCase() !== '0x08c379a0') return null
  try {
    const [reason] = decodeAbiParameters(
      [{ type: 'string' }],
      `0x${data.slice(10)}` as Hex,
    )
    return `Error(${JSON.stringify(reason)})`
  } catch {
    return null
  }
}

export function tryDecodePanic(data?: Hex): string | null {
  if (!data || data === '0x') return null
  if (data.slice(0, 10).toLowerCase() !== '0x4e487b71') return null
  try {
    const [codeBn] = decodeAbiParameters(
      [{ type: 'uint256' }],
      `0x${data.slice(10)}` as Hex,
    )
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
