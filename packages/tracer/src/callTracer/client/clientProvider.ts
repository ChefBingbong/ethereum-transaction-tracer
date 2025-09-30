import {
  type makeProgress,
  type Progress,
  type SafePromise,
  safeError,
  safeResult,
  safeTimeoutPromise,
} from '@evm-tt/utils'
import { createAnvil } from '@viem/anvil'
import { type PublicClient, createTestClient, http, publicActions } from 'viem'
import type {
  ClientLease,
  ClientProvider,
  Environment,
  TraceClient,
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

    const [error, _] = await safeTimeoutPromise(() => anvil.start(), 7000)

    if (error) return safeError(error)
    return safeResult({
      client: testClient,
      dispose: async (progress?: Progress) => {
        try {
          anvil.stop()
        } catch (error) {
          console.log(error)
        }
        progress?.done()
      },
    })
  }
}

export async function withClient<T>(
  env: Environment,
  progress: ReturnType<typeof makeProgress>,
  client: PublicClient,
  traceCallback: (client: TraceClient) => SafePromise<T>,
): SafePromise<T> {
  const provider = new DefaultClientProvider(client)
  const [error, lease] = await provider.lease(env)
  if (error) return safeError(error)
  const traceResult = await traceCallback(lease.client)
  await lease.dispose?.(progress)
  return traceResult
}
