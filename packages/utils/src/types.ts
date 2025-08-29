import type * as _ from 'radash'
import type { Address, Hex } from 'viem'

export type RetryConfigParams = Parameters<typeof _.retry>[0]

export type SafePromise<T, E extends Error | string = Error> = Promise<
  SafeError<E> | SafeResult<T>
>

export type Safe<T, E extends Error | string = Error> =
  | SafeError<E>
  | SafeResult<T>

export type SafeResult<T> = [undefined, T]
export type SafeError<E extends Error | string> = [E, undefined]

export type RpcCallType =
  | 'CALL'
  | 'STATICCALL'
  | 'DELEGATECALL'
  | 'CREATE'
  | 'CREATE2'
  | 'SELFDESTRUCT'
  | 'CALLCODE'

export type RpcLogTrace = {
  address: Address
  data: Hex
  position: Hex
  topics: [Hex, ...Hex[]]
}

export type RpcCallTrace = {
  from: Address
  gas: Hex
  gasUsed: Hex
  to: Address
  input: Hex
  output: Hex
  error?: string
  revertReason?: string
  calls?: RpcCallTrace[]
  logs?: RpcLogTrace[]
  value?: Hex
  type: RpcCallType
}
