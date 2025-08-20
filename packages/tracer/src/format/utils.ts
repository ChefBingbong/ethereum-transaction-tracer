import { formatEther, type Hex } from 'viem'
import type { RpcCallTrace } from '../callTracer'
import { hexToBig } from './traceFormatter'

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

export function sumInner(node: RpcCallTrace) {
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
