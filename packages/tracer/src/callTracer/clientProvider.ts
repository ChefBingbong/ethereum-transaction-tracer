import {
  type Progress,
  type SafePromise,
  safeError,
  safeResult,
  safeTimeoutPromise,
} from '@evm-tt/utils'
import { createAnvil } from '@viem/anvil'
import { type PublicClient, createTestClient, http, publicActions } from 'viem'

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

export class DefaultClientProvider implements ClientProvider {
  constructor(public readonly base: PublicClient) {}

  async lease(env: Environment): SafePromise<ClientLease> {
    if (env.kind === 'rpc') return safeResult({ client: this.base })

    const anvil = createAnvil({
      chainId: this.base.chain?.id,
      forkUrl: env.forkUrl ?? this.base.chain?.rpcUrls.default.http[0],
      forkBlockNumber: env.blockNumber,
    })

    const testClient = createTestClient({
      chain: this.base.chain,
      mode: 'anvil',
      transport: http(`http://${anvil.host}:${anvil.port}`, {
        timeout: 60_000,
      }),
    }).extend(publicActions) as PublicClient

    const [error, _] = await safeTimeoutPromise(() => anvil.start(), 7000)

    if (error) return safeError(error)
    return safeResult({
      client: testClient,
      dispose: async (progress?: Progress) => {
        const [error, _] = await safeTimeoutPromise(() => anvil.stop(), 7000)
        if (error) console.log(error)
        progress?.done()
      },
    })
  }
}
