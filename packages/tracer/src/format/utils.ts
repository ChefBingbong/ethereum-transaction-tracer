import { type Address, formatEther, type Hex } from 'viem'
import type { TracerCache } from '../cache'
import { type AbiRegistry, ensureAbi } from '../cache/index'
import type { RpcCallTrace, RpcCallType } from '../callTracer'
import { theme } from './theme'

export const badgeFor = (t: RpcCallType) =>
  theme.typeBadge(`[${t.toLowerCase()}]`)

export const addrLabel = (addr: Address | undefined, reg: AbiRegistry) => {
  if (!addr) return theme.addr('<unknown>')
  const key = addr.toLowerCase()
  const name = reg.labels?.[key]
  const addrC = theme.addr(key)
  return name ? `${theme.contract(name)}<${addrC}>` : addrC
}

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

export async function collectAddresses(
  root: RpcCallTrace,
): Promise<Set<Address>> {
  const s = new Set<Address>()
  const walk = (n: RpcCallTrace) => {
    if (n.to) s.add(n.to)
    if (n.from) s.add(n.from)
    if (n.logs) for (const lg of n.logs) s.add(lg.address)
    if (n.calls) n.calls.forEach(walk)
  }
  walk(root)
  return s
}

export async function prefetchAbis(root: RpcCallTrace, cache: TracerCache) {
  const addrs = await collectAddresses(root)
  return await Promise.all(Array.from(addrs).map((a) => ensureAbi(cache, a)))
}
