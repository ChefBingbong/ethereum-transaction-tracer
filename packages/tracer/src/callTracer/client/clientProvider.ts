import { type SafePromise, safeError, safeResult, safeTry } from '@evm-tt/utils'
import { createAnvil } from '@viem/anvil'
import { type PublicClient, createTestClient, http, publicActions } from 'viem'
import type {
  ClientLease,
  ClientProvider,
  CustomClientArgs,
  Environment,
  TraceResponse,
} from './types'

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

    const [error, _] = await safeTry(() => anvil.start())

    if (error) {
      anvil.stop()
      return safeError(error)
    }
    return safeResult({
      client: testClient,
      dispose: async () => {
        try {
          anvil.stop()
        } catch (error) {
          console.log(error)
        }
      },
    })
  }
}

export async function traceWithCustomClient({
  env = { kind: 'rpc' },
  client,
  traceCallback,
}: CustomClientArgs): SafePromise<TraceResponse> {
  const provider = new DefaultClientProvider(client)
  const [error, lease] = await provider.lease(env)
  if (error) return safeError(error)
  try {
    return await traceCallback(lease.client)
  } finally {
    await lease?.dispose?.()
  }
}
