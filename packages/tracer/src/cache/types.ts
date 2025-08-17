import type { Abi, AbiEvent, AbiFunction, Address, Hex } from 'viem'

export type AbiSource = {
  name: string
  fetch(address: Address): Promise<Abi | undefined>
}

export type AbiRegistry = {
  byAddress: Record<string, Abi | undefined> // lowercase keys
  labels: Record<string, string | undefined> // lowercase keys
  extraAbis: Abi[] // optional pool for selector fallback
  selectorIndex: Record<Hex, AbiFunction | undefined>
  eventIndex: Record<Hex, AbiEvent | undefined> // (optional) topic0 -> event
  sources: AbiSource[]
}

export type EnsureAbiOptions = {
  saveDir?: string
  overwrite?: boolean
}

export interface I4BytesEntry {
  id: number
  createdAt: string
  textSignature: string
  hexSignature: string
  bytesSignature: string
}

export type CacheJson = {
  tokenDecimals?: [string, number][]
  contractNames?: [string, string][]
  fourByteDir?: [string, AbiFunction][]
  contractAbi?: [string, Abi][]
  eventsDir?: [string, AbiEvent][]
  extraAbis?: Abi[]
}

export type CacheOptions = {
  byAddress?: Record<string, Abi>
  labels?: Record<string, string>
  extraAbis?: Abi[]
  sources?: AbiSource[]
}
