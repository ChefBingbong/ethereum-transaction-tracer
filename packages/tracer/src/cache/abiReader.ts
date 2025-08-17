import { sleep } from 'bun'
import type { Abi, Address } from 'viem'
import {
  type AbiEvent,
  type AbiFunction,
  type Hex,
  keccak256,
  toBytes,
} from 'viem'
import type { TracerCache } from './abiCache'
import { etherscanLikeSource } from './abiSources'

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

export function createAbiRegistry(
  cache: TracerCache,
  input: {
    byAddress?: Record<string, Abi>
    // labels?: Record<string, string>
    extraAbis?: Abi[]
    // sources?: AbiSource[]
  } = {},
) {
  if (input.byAddress) {
    for (const [addr, abi] of Object.entries(input.byAddress)) {
      const key = toL(addr)
      if (!cache.contractAbi.has(key)) {
        cache.contractAbi.set(key, abi)
        indexAbi(cache, abi)
      }
    }
  }
  if (input.extraAbis) {
    for (const abi of input.extraAbis) {
      cache.extraAbis.push(abi)
      indexAbi(cache, abi)
    }
  }
  cache.save()
}

export async function ensureAbi(
  cache: TracerCache,
  address: Address | undefined,
): Promise<Abi | undefined> {
  if (!address) return undefined
  await cache.load()

  const key = toL(address)
  if (cache.contractAbi.has(key)) {
    return cache.contractAbi.get(key)
  }

  try {
    const abi = await etherscanLikeSource(
      address,
      'https://api.etherscan.io/v2',
      '8E6CI28EZUYCY1GG8CMZTPCCCNCVYCS8S2',
    )

    if (abi?.length) {
      addAbi(cache, address, abi)
      await sleep(2000)
      return abi
    }
  } catch (e) {
    console.warn(`ensureAbi: remote fetch failed for ${key}:`, e)
  }
  return undefined
}
