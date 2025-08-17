import { join } from 'node:path'
import type { Abi, AbiEvent, AbiFunction } from 'viem'

type CacheJson = {
  tokenDecimals?: [string, number][]
  contractNames?: [string, string][]
  fourByteDir?: [string, AbiFunction][]
  contractAbi?: [string, Abi][]
  eventsDir?: [string, AbiEvent][]
}

export class TracerCache {
  public tokenDecimals = new Map<string, number>()
  public contractNames = new Map<string, string>()
  public fourByteDir = new Map<string, AbiFunction>()
  public contractAbi = new Map<string, Abi>()
  public eventsDir = new Map<string, AbiEvent>()
  public extraAbis: Abi[] = []

  public cachePath: string | undefined

  setCachePath(cachePath: string) {
    this.cachePath = cachePath
  }

  async load(): Promise<void> {
    const filePath = this.getTracerCachePath()
    const file = Bun.file(filePath)

    let json: CacheJson = {}
    try {
      if (await file.exists()) {
        json = (await file.json()) as CacheJson
      }
    } catch {
      json = {}
    }

    this.tokenDecimals = new Map(json.tokenDecimals ?? [])
    this.contractNames = new Map(json.contractNames ?? [])
    this.fourByteDir = new Map(json.fourByteDir ?? [])
    this.contractAbi = new Map(json.contractAbi ?? [])
    this.eventsDir = new Map(json.eventsDir ?? [])
  }

  async save(): Promise<void> {
    const filePath = this.getTracerCachePath()

    const payload: CacheJson = {
      tokenDecimals: Array.from(this.tokenDecimals.entries()),
      contractNames: Array.from(this.contractNames.entries()),
      fourByteDir: Array.from(this.fourByteDir.entries()),
      contractAbi: Array.from(this.contractAbi.entries()),
      eventsDir: Array.from(this.eventsDir.entries()),
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
}
