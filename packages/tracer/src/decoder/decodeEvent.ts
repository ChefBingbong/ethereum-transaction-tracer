import { type Address, decodeEventLog, type Hex } from 'viem'
import type { TracerCache } from '../cache'

export function safeDecodeEvent(
  cache: TracerCache,
  address: Address,
  topics: [signature: `0x${string}`, ...args: `0x${string}`[]] | undefined,
  data: Hex | undefined,
): { name?: string; args?: Record<string, unknown> } {
  if (!topics || topics.length === 0) return {}
  const addrKey = address.toLowerCase()
  const abi = cache.contractAbi.get(addrKey)
  if (abi) {
    try {
      const dec = decodeEventLog({
        abi,
        topics,
        data: data ?? '0x',
        strict: false,
      })
      const argsObj: Record<string, unknown> = {}
      if (dec.args && typeof dec.args === 'object') {
        for (const [k, v] of Object.entries(dec.args)) {
          if (!/^\d+$/.test(k)) argsObj[k] = v
        }
      }
      return { name: dec.eventName, args: argsObj }
    } catch {}
  }
  const t0 = topics[0] as Hex
  const ev = cache.eventsDir.get(t0)
  if (ev) return { name: ev.name }
  return {}
}
