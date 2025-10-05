import { join } from 'node:path'
import { AddressMap, safeSyncTry } from '@evm-tt/utils'
import fs from 'fs-extra'
import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  getAddress,
  toEventSelector,
  toFunctionSelector,
} from 'viem'
import type {
  AbiCache,
  AbiError,
  AbiInfo,
  CacheJson,
  CacheObj,
  CacheOptions,
  RpcCallTrace,
} from '../types'
import {
  prefetchAbisFromEtherscan,
  prefetchAbisFromOpenChain,
  toErrorSelector,
} from './cacheHelpers'

export function createAbiCache(
  chainId: number,
  cachePath: string,
  input?: CacheOptions,
): AbiCache {
  const cache: CacheObj = {
    contractNames: new AddressMap<string>(),
    fourByteDir: new AddressMap<AbiFunction>(),
    errorDir: new AddressMap<AbiError>(),
    eventsDir: new AddressMap<AbiEvent>(),
    signatureDir: new AddressMap<string>(),
    signatureEvDir: new AddressMap<string>(),
    extraAbis: [],
  }

  if (input?.byAddress) {
    for (const [addr, info] of Object.entries(input.byAddress)) {
      const address = getAddress(addr)
      indexAbiWithInfo({ address, ...info })
    }
  }
  if (input?.extraAbis) {
    for (const abi of input.extraAbis) {
      cache.extraAbis.push(abi)
      indexAbi(abi)
    }
  }
  if (input?.contractNames) {
    for (const [addr, name] of Object.entries(input.contractNames)) {
      const address = getAddress(addr)
      cache.contractNames.set(address, name)
    }
  }

  const filePath = getTracerCachePath()
  fs.ensureFileSync(filePath)

  const [error, json] = safeSyncTry<CacheJson>(() => fs.readJSONSync(filePath))
  if (!error) {
    json.contractNames?.forEach(([key, v]) => {
      cache.contractNames.set(key, v)
    })
    json.fourByteDir?.forEach(([key, v]) => {
      cache.fourByteDir.set(key, v)
    })
    json.eventsDir?.forEach(([key, v]) => {
      cache.eventsDir.set(key, v)
    })
    json.errorDir?.forEach(([key, v]) => {
      cache.errorDir.set(key, v)
    })
    json.signatureDir?.forEach(([key, v]) => {
      cache.signatureDir.set(key, v)
    })
    json.signatureEvDir?.forEach(([key, v]) => {
      cache.signatureEvDir.set(key, v)
    })
  }

  function getTracerCachePath() {
    return join(cachePath, 'evm-tt-cache.json')
  }

  const save = () => {
    const filePath = getTracerCachePath()
    fs.ensureFileSync(filePath)

    const [error, _] = safeSyncTry(() =>
      fs.writeJSONSync(
        filePath,
        {
          contractNames: Array.from(cache.contractNames.entries()),
          fourByteDir: Array.from(cache.fourByteDir.entries()),
          eventsDir: Array.from(cache.eventsDir.entries()),
          errorDir: Array.from(cache.errorDir.entries()),
          signatureDir: Array.from(cache.signatureDir.entries()),
          signatureEvDir: Array.from(cache.signatureEvDir.entries()),
        },
        { spaces: 2 },
      ),
    )
    if (error) return
  }

  function indexAbiWithInfo({ name, address, abi }: AbiInfo) {
    if (!cache.contractNames.has(address)) {
      cache.contractNames.set(address, name)
    }
    indexAbi(abi)
  }

  function indexAbi(abi: Abi) {
    for (const item of abi) {
      switch (item.type) {
        case 'function': {
          const sel = toFunctionSelector(item)
          if (cache.fourByteDir.has(sel)) break
          cache.fourByteDir.set(sel, item)
          break
        }
        case 'event': {
          const t0 = toEventSelector(item)
          if (cache.eventsDir.has(t0)) break
          cache.eventsDir.set(t0, item)
          break
        }
        case 'error': {
          const errorSel = toErrorSelector(item)
          if (cache.errorDir.has(errorSel)) break
          cache.errorDir.set(errorSel, item)
          break
        }
      }
    }
  }

  const prefetchAllAbisFromCall = async (root: RpcCallTrace) => {
    if (input?.etherscanApiKey) {
      await prefetchAbisFromEtherscan(
        cache,
        root,
        chainId,
        input.etherscanApiKey,
      )
    }
    await prefetchAbisFromOpenChain(cache, root)
  }
  return { save, cache, prefetchAllAbisFromCall }
}
