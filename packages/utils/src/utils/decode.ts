import type { Hex } from 'viem'
import { decodeAbiParameters } from 'viem/utils'
import { PANIC_MAP } from './utils'

type KV = Record<string, string>

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

export function tryDecodeErrorString(data: Hex) {
  if (data.slice(0, 10) !== '0x08c379a0') return null
  const [reason] = decodeAbiParameters([{ type: 'string' }], `0x${data.slice(10)}`)
  return `Error(${JSON.stringify(reason)})`
}

export function tryDecodePanic(data: Hex) {
  if (data.slice(0, 10) !== '0x4e487b71') return null
  const [codeBn] = decodeAbiParameters([{ type: 'uint256' }], `0x${data.slice(10)}`)
  const msg = PANIC_MAP[Number(codeBn)] ?? 'panic'
  return `Panic(0x${codeBn.toString(16)}: ${msg})`
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
