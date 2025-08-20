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
  tokenDecimals?: [Address, number][]
  contractNames?: [Address, string][]
  fourByteDir?: [Hex, AbiFunction][]
  contractAbi?: [string, Abi][]
  eventsDir?: [Hex, AbiEvent][]
  extraAbis?: Abi[]
  undefinedSignatures?: Address[]
  tempAddressCache?: Address[]
}

export type CacheOptions = {
  etherscanApiKey?: string
  byAddress?: Record<string, Abi>
  labels?: Record<string, string>
  extraAbis?: Abi[]
  sources?: AbiSource[]
}

export type FourByteSelector = `0x${string}`

export type SignatureEntry = {
  name: string
  filtered: boolean
}

export type SelectorIndex = Record<FourByteSelector, SignatureEntry[]>

export type DecodeResult = {
  event: SelectorIndex
  function: SelectorIndex
}
