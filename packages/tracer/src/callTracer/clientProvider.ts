import { createAnvil } from '@viem/anvil'
import { createTestClient, http, type PublicClient, publicActions } from 'viem'

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
  dispose?: () => Promise<void>
}

export interface ClientProvider {
  lease(env: Environment): Promise<ClientLease>
}

export class DefaultClientProvider implements ClientProvider {
  constructor(public readonly base: PublicClient) {}

  async lease(env: Environment): Promise<ClientLease> {
    if (env.kind === 'rpc') return { client: this.base }

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

    await anvil.start()

    return {
      client: testClient,
      dispose: async () => {
        try {
          //   await anvil.stop()
        } catch {
          /* noop */
        }
      },
    }
  }
}
