import type { Progress, SafePromise } from '@evm-tt/utils'
import type { PublicClient } from 'viem'

export type Environment =
  | { kind: 'rpc' }
  | { kind: 'fork'; blockNumber?: number; forkUrl?: string }

export type TraceClient = Pick<
  PublicClient,
  'request' | 'prepareTransactionRequest' | 'chain' | 'account'
>

export type TraceRunOptions = {
  env?: Environment
  showProgressBar?: boolean
  streamLogs?: boolean
  gasProfiler?: boolean
}

export interface ClientLease {
  client: TraceClient
  dispose?: (progress?: Progress) => Promise<void>
}

export interface ClientProvider {
  lease(env: Environment): SafePromise<ClientLease>
}
