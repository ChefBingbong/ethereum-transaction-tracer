import { join } from 'node:path'
import { sleep } from 'bun'
import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  type Address,
  type Hex,
  keccak256,
  parseAbiItem,
  toBytes,
  zeroAddress,
} from 'viem'
import { getAbiFromEtherscan, getAbiFunctionFromOpenChain } from './abiSources'
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
  private input?: CacheOptions

  public cachePath: string | undefined

  constructor(cachePath: string, input?: CacheOptions) {
    this.input = input
    this.setCachePath(cachePath)

    if (input?.byAddress) {
      for (const [addr, abi] of Object.entries(input.byAddress)) {
        const key = toL(addr)
        if (!this.contractAbi.has(key)) {
          this.contractAbi.set(key, abi)
          this.indexAbi(abi)
        }
      }
    }
    if (input?.extraAbis) {
      for (const abi of input.extraAbis) {
        this.extraAbis.push(abi)
        this.indexAbi(abi)
      }
    }
    this.save()
  }

  setCachePath(cachePath: string) {
    this.cachePath = cachePath
  }

  async load(): Promise<void> {
    const filePath = this.getTracerCachePath()
    const file = Bun.file(filePath)

    let json: CacheJson = {}
    try {
      if (await file.exists()) {
        json = await file.json()
      }
    } catch {
      json = {}
    }

    json.tokenDecimals?.forEach(([key, v]) => {
      this.tokenDecimals.set(key, v)
    })
    json.contractNames?.forEach(([key, v]) => {
      this.contractNames.set(key, v)
    })
    json.fourByteDir?.forEach(([key, v]) => {
      this.fourByteDir.set(key, v)
    })
    json.contractAbi?.forEach(([key, v]) => {
      this.contractAbi.set(key, v)
    })
    json.eventsDir?.forEach(([key, v]) => {
      this.eventsDir.set(key, v)
    })

    if (json.extraAbis) {
      this.extraAbis = json.extraAbis
    }
    if (json.undefinedSignatures) {
      this.undefinedSignatures = json.undefinedSignatures
    }
  }

  async save(): Promise<void> {
    const filePath = this.getTracerCachePath()
    await this.load()

    const payload: CacheJson = {
      tokenDecimals: Array.from(this.tokenDecimals.entries()),
      contractNames: Array.from(this.contractNames.entries()),
      fourByteDir: Array.from(this.fourByteDir.entries()),
      contractAbi: Array.from(this.contractAbi.entries()),
      eventsDir: Array.from(this.eventsDir.entries()),
      undefinedSignatures: this.undefinedSignatures,
      extraAbis: this.extraAbis,
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

  public indexAbi(abi: Abi) {
    for (const item of abi) {
      if (item.type === 'function') {
        const sel = this.selectorOf(item as AbiFunction)
        if (!this.fourByteDir.has(sel)) this.fourByteDir.set(sel, item)
      } else if (item.type === 'event') {
        const t0 = this.topic0Of(item as AbiEvent)
        if (!this.eventsDir.has(t0)) this.eventsDir.set(t0, item)
      }
    }
  }

  public addAbi = async (address: Address, abi: Abi) => {
    const key = toL(address)
    if (!this.contractAbi.has(key)) {
      this.contractAbi.set(key, abi)
    }
    this.indexAbi(abi)
  }

  public ensureAbi = async (
    address: Address | undefined,
    input?: string,
  ): Promise<Abi | undefined> => {
    if (!address || address === zeroAddress) return undefined

    const key = toL(address)
    if (this.contractAbi.has(key)) {
      return this.contractAbi.get(key)
    }

    if (input) {
      const selector = input.slice(0, 10) as Hex
      if (!this.fourByteDir.get(selector)) {
        const [error, abiSig] = await getAbiFunctionFromOpenChain(selector)

        if (!error) {
          const abiItem = parseAbiItem(abiSig) as AbiFunction
          this.fourByteDir.set(selector, abiItem)
        }
      }
    }

    const [error, abi] = await getAbiFromEtherscan(
      address,
      999,
      this.input?.etherscanApiKey,
    )

    if (!error) {
      this.addAbi(address, abi)
      await sleep(1000)
      return abi
    }

    await this.save()
    return undefined
  }
}
