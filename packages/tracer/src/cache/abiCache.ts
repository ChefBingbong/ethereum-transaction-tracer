import { join } from 'node:path'
import {
  AddressMap,
  safeResult,
  safeTimeoutPromiseAll,
  safeTry,
} from '@evm-transaction-trace/utils'
import { sleep } from 'bun'
import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  type Address,
  type Hex,
  keccak256,
  stringToHex,
  toBytes,
  toFunctionSelector,
} from 'viem'
import type { AbiError, CacheJson, CacheOptions, RpcCallTrace } from '../types'
import { getAbiFromEtherscan, getAbiFunctionFromOpenChain } from './abiSources'

export const toL = (a?: string) => (a ? a.toLowerCase() : a) as string

export class TracerCache {
  public tokenDecimals = new AddressMap<number>()
  public contractNames = new AddressMap<string>()
  public fourByteDir = new AddressMap<AbiFunction>()
  public errorDir = new AddressMap<AbiError | string>()
  public contractAbi = new AddressMap<Abi>()
  public eventsDir = new AddressMap<AbiEvent>()
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

  public abiItemFromSelector(input: Hex) {
    const selector = input.slice(0, 10) as Hex
    return this.fourByteDir.get(selector)
  }

  public abiEventFromTopic(topic0: Hex) {
    return this.eventsDir.get(topic0)
  }

  async load(): Promise<void> {
    const filePath = this.getTracerCachePath()
    const file = Bun.file(filePath)

    const fileExists = await file.exists()
    if (!fileExists) return

    const [error, json] = await safeTry<CacheJson>(() => file.json())
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
    json.errorDir?.forEach(([key, v]) => {
      this.errorDir.set(key, v)
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
      errorDir: Array.from(this.errorDir.entries()),
      tempAddressCache: Array.from(this.tempAddressCache.values()),
    }

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

  formatAbiItemSignature(item: { name: string; inputs?: { type: string }[] }) {
    return `${item.name}(${(item.inputs ?? []).map((i) => i.type).join(',')})`
  }

  toErrorSelector(err: any): Hex {
    const sig = this.formatAbiItemSignature(err)
    const hash = keccak256(stringToHex(sig))
    return hash.slice(0, 10) as Hex
  }

  public indexAbiWithInfo({ name, address, abi }: { name: string; abi: Abi; address: Address }) {
    if (!this.contractNames.has(address)) {
      this.contractNames.set(address, name)
    }
    this.indexAbi(abi)
  }

  private indexAbi(abi: Abi) {
    for (const item of abi) {
      if (item.type === 'function') {
        const sel = toFunctionSelector(item)
        if (!this.fourByteDir.has(sel)) {
          this.fourByteDir.set(sel, item)
        }
      } else if (item.type === 'event') {
        const t0 = this.topic0Of(item)
        if (!this.eventsDir.has(t0)) this.eventsDir.set(t0, item)
      } else if (item.type === 'error') {
        const errorSel = this.toErrorSelector(item)
        if (!this.errorDir.has(errorSel)) this.errorDir.set(errorSel, item as AbiError)
      }
    }
  }

  public indexTraceAbis = async (address: Address, input: Hex) => {
    if (this.abiItemFromSelector(input)) return

    const [error, abi] = await getAbiFromEtherscan(
      address,
      this.chainId,
      this.input?.etherscanApiKey,
    )

    if (!error) {
      this.indexAbiWithInfo(abi)
      await sleep(1000)
    }
  }

  public indexCallAbis = async (addresses: Address[]) => {
    const results = await Promise.all(
      addresses.map(async (a) => {
        await sleep(500)
        const [error, result] = await getAbiFromEtherscan(
          a,
          this.chainId,
          this.input?.etherscanApiKey,
        )
        return error ? undefined : result
      }),
    )
    for (const abi of results) {
      if (abi) this.indexAbiWithInfo(abi)
    }
  }

  public indexTraceError = async (input: Hex) => {
    const errSel = input.slice(0, 10) as Hex
    if (this.errorDir.has(errSel)) return

    const [error, abi] = await getAbiFunctionFromOpenChain(errSel, false)

    if (!error) {
      this.errorDir.set(errSel, abi)
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
