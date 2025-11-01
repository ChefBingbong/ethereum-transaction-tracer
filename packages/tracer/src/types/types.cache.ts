import type { AddressMap } from '@evm-tt/utils'
import type {
  Abi,
  AbiEvent,
  AbiFunction,
  AbiParameter,
  Address,
  Hex,
} from 'viem'
import type { RpcCallTrace } from './types.tracer'

export type CacheJson = {
  contractNames?: [Address, string][]
  fourByteDir?: [Hex, AbiFunction][]
  contractAbi?: [string, Abi][]
  eventsDir?: [Hex, AbiEvent][]
  errorDir?: [Hex, AbiError][]
  signatureDir?: [Hex, string][]
  signatureEvDir?: [Hex, string][]

  extraAbis?: Abi[]
}

export type CacheOptions = {
  etherscanApiKey?: string
  byAddress?: Record<
    string,
    {
      name: string
      abi: Abi
    }
  >
  contractNames?: Record<string, string>
  extraAbis?: Abi[]
}

export type AbiError = {
  type: 'error'
  inputs: readonly AbiParameter[]
  name: string
}

export type AbiInfo = { name: string; abi: Abi; address: Address }
export type EventTopic = [signature: `0x${string}`, ...args: `0x${string}`[]]

export type CacheObj = {
  contractNames: AddressMap<string>
  fourByteDir: AddressMap<AbiFunction>
  errorDir: AddressMap<AbiError>
  eventsDir: AddressMap<AbiEvent>
  signatureDir: AddressMap<string>
  signatureEvDir: AddressMap<string>
  extraAbis: Abi[]
}

export interface AbiCache {
  save: () => void
  cache: CacheObj
  prefetchAllAbisFromCall: (root: RpcCallTrace) => Promise<void>
}
