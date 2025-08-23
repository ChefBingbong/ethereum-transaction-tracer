import type { Hex } from 'viem'
import { decodeAbiParameters } from 'viem/utils'
import { safeSyncTry } from './safe'

type KV = Record<string, string>

export function tryDecodePretty(spec: string[], data?: Hex) {
  if (!data || data === '0x') return undefined
  const params = spec.map((s) => {
    const i = s.indexOf(' ')
    if (i === -1) return { type: s } as const
    return { type: s.slice(0, i), name: s.slice(i + 1) } as const
  })
  const out: KV = {}
  const [error, values] = safeSyncTry(() => decodeAbiParameters(params, data) as unknown[])
  if (error) return `data: ${trunc(data)}`

  for (let i = 0; i < params.length; i++) {
    const name = params[i].name ?? String(i)
    let val = values[i]
    if (typeof val === 'bigint') val = val.toString()
    if (typeof val === 'string') val = trunc(val)
    out[name] = String(val)
  }
  return kvList(out)
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
