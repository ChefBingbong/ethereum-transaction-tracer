import type { SafePromise } from '@evm-tt/utils'
import type { PublicClient } from 'viem'
import type { RpcCallTrace } from '../../types'

export type Progress = {
  inc: (n: number) => void
  done: () => void
}

export type Environment =
  | { kind: 'rpc' }
  | { kind: 'fork'; blockNumber?: number; forkUrl?: string }

export type TraceClient = Pick<
  PublicClient,
  'request' | 'prepareTransactionRequest' | 'chain' | 'account'
>

export type TraceRunOptions = {
  env?: Environment
}

export interface ClientLease {
  client: TraceClient
  dispose?: (progress?: Progress) => Promise<void>
}

export interface ClientProvider {
  lease(env: Environment): SafePromise<ClientLease>
}

export type TraceResponse = {
  traceRaw: RpcCallTrace
  traceFormatted: string | undefined
}

export type CustomClientArgs = {
  env?: Environment
  client: PublicClient
  traceCallback: (client: TraceClient) => SafePromise<TraceResponse>
}
