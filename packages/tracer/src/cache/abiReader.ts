import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  type Address,
  type Hex,
  keccak256,
  toBytes,
} from 'viem'
import type { TracerCache } from './abiCache'

export const toL = (a?: string) => (a ? a.toLowerCase() : a) as string

export const selectorOf = (fn: AbiFunction): Hex => {
  const sig = `${fn.name}(${(fn.inputs ?? []).map((i) => i.type).join(',')})`
  const hash = keccak256(toBytes(sig))
  return `0x${hash.slice(2, 10)}` as Hex
}
export const topic0Of = (ev: AbiEvent): Hex => {
  const sig = `${ev.name}(${(ev.inputs ?? []).map((i) => i.type).join(',')})`
  return keccak256(toBytes(sig))
}

export function indexAbi(cache: TracerCache, abi: Abi) {
  for (const item of abi) {
    if (item.type === 'function') {
      const sel = selectorOf(item as AbiFunction)
      if (!cache.fourByteDir.has(sel)) cache.fourByteDir.set(sel, item)
    } else if (item.type === 'event') {
      const t0 = topic0Of(item as AbiEvent)
      if (!cache.eventsDir.has(t0)) cache.eventsDir.set(t0, item)
    }
  }
}

export function addAbi(cache: TracerCache, address: Address, abi: Abi) {
  const key = toL(address)
  if (!cache.contractAbi.has(key)) {
    cache.contractAbi.set(key, abi)
  }
  indexAbi(cache, abi)
  cache.save()
}
