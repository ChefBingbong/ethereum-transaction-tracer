import { join } from 'node:path'
import { safeResult, safeTimeoutPromiseAll, safeTry } from '@evm-transaction-trace/core'
import { sleep } from 'bun'
import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  type Address,
  type Hex,
  keccak256,
  toBytes,
  toFunctionSelector,
  zeroAddress,
} from 'viem'
import type { RpcCallTrace } from '../callTracer'
import { getAbiFromEtherscan } from './abiSources'
import type { CacheJson, CacheOptions } from './types'

export const toL = (a?: string) => (a ? a.toLowerCase() : a) as string

export class TracerCache {
  public tokenDecimals = new Map<string, number>()
  public contractNames = new Map<string, string>()
  public fourByteDir = new Map<string, AbiFunction>()
  public contractAbi = new Map<string, Abi>()
  public eventsDir = new Map<string, AbiEvent>()
  public extraAbis: Abi[] = []
  public undefinedSignatures: Address[] = []
  public chainId: number
  public tempAddressCache: Set<Address> = new Set()

  private input?: CacheOptions

  public cachePath: string | undefined

  constructor(chainId: number, cachePath: string, input?: CacheOptions) {
    this.input = input
    this.chainId = chainId
    this.setCachePath(cachePath)

    if (input?.extraAbis) {
      for (const abi of input.extraAbis) {
        this.extraAbis.push(abi)
        this.indexAbi(abi)
      }
    }
  }

  setCachePath(cachePath: string) {
    this.cachePath = cachePath
  }

  async load(): Promise<void> {
    const filePath = this.getTracerCachePath()
    const file = Bun.file(filePath)

    const fileExists = await file.exists()
    if (!fileExists) return

    const [error, json] = await safeTry<CacheJson>(file.json())
    if (error) return

    json.tokenDecimals?.forEach(([key, v]) => {
      this.tokenDecimals.set(key, v)
    })
    json.contractNames?.forEach(([key, v]) => {
      this.contractNames.set(key, v)
    })
    json.fourByteDir?.forEach(([key, v]) => {
      this.fourByteDir.set(key, v)
    })
    json.eventsDir?.forEach(([key, v]) => {
      this.eventsDir.set(key, v)
    })
    this.tempAddressCache = new Set(json.tempAddressCache)
  }

  async save(): Promise<void> {
    const filePath = this.getTracerCachePath()

    const payload: CacheJson = {
      tokenDecimals: Array.from(this.tokenDecimals.entries()),
      contractNames: Array.from(this.contractNames.entries()),
      fourByteDir: Array.from(this.fourByteDir.entries()),
      eventsDir: Array.from(this.eventsDir.entries()),
      tempAddressCache: Array.from(this.tempAddressCache.values()),
    }

    console.log(this.fourByteDir.has('0xd2ac1c8e'))
    await Bun.write(filePath, JSON.stringify(payload, null, 2), {
      createPath: true,
    })
  }
  private getTracerCachePath(): string {
    if (!this.cachePath) {
      throw new Error('[tracer] cachePath not set')
    }
    return join(this.cachePath, 'hardhat-tracer-cache', 'data.json')
  }

  public selectorOf = (fn: AbiFunction): Hex => {
    const sig = `${fn.name}(${(fn.inputs ?? []).map((i) => i.type).join(',')})`
    const hash = keccak256(toBytes(sig))
    return `0x${hash.slice(2, 10)}` as Hex
  }
  public topic0Of = (ev: AbiEvent): Hex => {
    const sig = `${ev.name}(${(ev.inputs ?? []).map((i) => i.type).join(',')})`
    return keccak256(toBytes(sig))
  }

  public indexAbi(abi: Abi) {
    for (const item of abi) {
      if (item.type === 'function') {
        const sel = toFunctionSelector(item as AbiFunction).toLowerCase()
        if (!this.fourByteDir.has(sel)) {
          this.fourByteDir.set(sel, item)
        }
      } else if (item.type === 'event') {
        const t0 = this.topic0Of(item as AbiEvent).toLowerCase()
        if (!this.eventsDir.has(t0)) this.eventsDir.set(t0, item)
      }
    }
  }

  public indexTraceAbis = async (address: Address | undefined, input?: string) => {
    if (!address || address === zeroAddress) return

    if (input) {
      const selector = input.slice(0, 10).toLowerCase() as Hex
      if (this.fourByteDir.has(selector)) return
    }

    const [error, abi] = await getAbiFromEtherscan(
      address,
      this.chainId,
      this.input?.etherscanApiKey,
    )

    if (!error) {
      this.indexAbi(abi)
      await sleep(1000)
    }
  }

  public prefetchTraceAbis = async (root: RpcCallTrace) => {
    if (!root.calls) return safeResult(undefined)
    return safeTimeoutPromiseAll(
      root.calls.map((a) => this.indexTraceAbis(a.to, a.input)),
      10000,
    )
  }
}
