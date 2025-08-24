import { join } from 'node:path'
import { AddressMap, safeTry } from '@evm-transaction-trace/utils'
import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  type Address,
  getAddress,
  type Hex,
  keccak256,
  stringToHex,
  toBytes,
  toFunctionSelector,
} from 'viem'
import { ETHERSCAN_RATE_LIMIT } from '../constants'
import type { AbiError, AbiInfo, CacheJson, CacheOptions, RpcCallTrace } from '../types'
import { getAbiFromEtherscan } from './abiSources'

const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms))

export class TracerCache {
  public contractNames = new AddressMap<string>()
  public fourByteDir = new AddressMap<AbiFunction>()
  public errorDir = new AddressMap<AbiError>()
  public eventsDir = new AddressMap<AbiEvent>()
  public extraAbis: Abi[] = []
  private cachePath: string | undefined

  private readonly chainId: number
  private readonly input?: CacheOptions

  constructor(chainId: number, cachePath: string, input?: CacheOptions) {
    this.input = input
    this.chainId = chainId
    this.setCachePath(cachePath)

    if (input?.byAddress) {
      for (const [addr, info] of Object.entries(input.byAddress)) {
        const address = getAddress(addr)
        this.indexAbiWithInfo({ address, ...info })
      }
    }
    if (input?.extraAbis) {
      for (const abi of input.extraAbis) {
        this.extraAbis.push(abi)
        this.indexAbi(abi)
      }
    }
    if (input?.contractNames) {
      for (const [addr, name] of Object.entries(input.contractNames)) {
        const address = getAddress(addr)
        this.contractNames.set(address, name)
      }
    }
  }

  async load(): Promise<void> {
    const filePath = this.getTracerCachePath()
    const file = Bun.file(filePath)

    const fileExists = await file.exists()
    if (!fileExists) return

    const [error, json] = await safeTry<CacheJson>(() => file.json())
    if (error) return

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
  }

  async save(): Promise<void> {
    const filePath = this.getTracerCachePath()

    const payload: CacheJson = {
      contractNames: Array.from(this.contractNames.entries()),
      fourByteDir: Array.from(this.fourByteDir.entries()),
      eventsDir: Array.from(this.eventsDir.entries()),
      errorDir: Array.from(this.errorDir.entries()),
    }

    await Bun.write(filePath, JSON.stringify(payload, null, 2), {
      createPath: true,
    })
  }

  private getTracerCachePath(): string {
    if (!this.cachePath) {
      throw new Error('[tracer] cachePath not set')
    }
    return join(this.cachePath, 'evm-tt-cache.json')
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

  public toEventSelector = (ev: AbiEvent): Hex => {
    const sig = this.formatAbiItemSignature(ev)
    return keccak256(toBytes(sig))
  }

  toErrorSelector(err: AbiError): Hex {
    const sig = this.formatAbiItemSignature(err)
    const hash = keccak256(stringToHex(sig))
    return hash.slice(0, 10) as Hex
  }

  private formatAbiItemSignature(item: AbiError | AbiEvent | AbiFunction) {
    return `${item.name}(${(item.inputs ?? []).map((i) => i.type).join(',')})`
  }

  public prefetchUnknownAbis = async (addresses: Address[]) => {
    if (!this.input?.etherscanApiKey) return
    for (let i = 0; i < addresses.length; i += ETHERSCAN_RATE_LIMIT) {
      const results = await Promise.all(
        addresses.slice(i, i + ETHERSCAN_RATE_LIMIT).map(async (a) => {
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

      if (i + ETHERSCAN_RATE_LIMIT < addresses.length) {
        await sleep(1000)
      }
    }
  }

  public indexAbiWithInfo({ name, address, abi }: AbiInfo) {
    if (!this.contractNames.has(address)) {
      this.contractNames.set(address, name)
    }
    this.indexAbi(abi)
  }

  private indexAbi(abi: Abi) {
    for (const item of abi) {
      switch (item.type) {
        case 'function': {
          const sel = toFunctionSelector(item)
          if (this.fourByteDir.has(sel)) break
          this.fourByteDir.set(sel, item)
          break
        }
        case 'event': {
          const t0 = this.toEventSelector(item)
          if (this.eventsDir.has(t0)) break
          this.eventsDir.set(t0, item)
          break
        }
        case 'error': {
          const errorSel = this.toErrorSelector(item)
          if (this.errorDir.has(errorSel)) break
          this.errorDir.set(errorSel, item)
          break
        }
      }
    }
  }

  public getUnknownAbisFromCall = (root: RpcCallTrace) => {
    const calls: Set<Address> = new Set()
    this.aggregateCallInputs(root, 0, calls)
    return calls.values().toArray()
  }
  private aggregateCallInputs(node: RpcCallTrace, depth: number, calls: Set<Address>) {
    const inputSelector = this.abiItemFromSelector(node.input)
    const outputSelector = this.abiItemFromSelector(node?.output ?? '')

    if (!inputSelector) calls.add(node.to)
    if (node.error && !outputSelector) calls.add(node.to)
    if (!this.contractNames.has(node.to)) calls.add(node.to)

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      this.aggregateCallInputs(children[i], depth + 1, calls)
    }
  }
}
