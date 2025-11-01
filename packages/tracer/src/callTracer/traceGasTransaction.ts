import { safeError, safeResult, safeTry } from '@evm-tt/utils'
import type { BaseError, PublicClient } from 'viem'
import { getTransactionError } from 'viem/utils'
import { createAbiCache } from '../cache'
import { coerceUnsupportedTraceError } from '../errors'
import { printGasTrace } from '../print'
import {
  type AbiCache,
  LogVerbosity,
  type TraceTxParameters,
  type TraceTxRpcSchema,
} from '../types'
import { traceWithCustomClient } from './client/clientProvider'
import type { TraceClient } from './client/types'

export const traceGasTransactionHash = async (
  { txHash, tracerOps: { env, cache: cacheOptions } }: TraceTxParameters,
  client: PublicClient,
) => {
  return traceWithCustomClient({
    env,
    client,
    traceCallback: async (client) => {
      const cache = createAbiCache(
        client.chain?.id!,
        cacheOptions.cachePath,
        cacheOptions,
      )

      const [traceError, trace] = await callTraceTxHash(
        { txHash, tracerOps: { cache: cacheOptions } },
        client,
        cache,
      )
      if (traceError) return safeError(traceError)

      const [formatError, lines] = await printGasTrace(trace, {
        cache,
        verbosity: LogVerbosity.Highest,
      })

      const out = { traceRaw: trace, traceFormatted: lines }
      return formatError ? safeError(formatError) : safeResult(out)
    },
  })
}

const callTraceTxHash = async (
  { txHash }: TraceTxParameters,
  client: TraceClient,
  cache: AbiCache,
) => {
  const [error, trace] = await safeTry(() =>
    client.request<TraceTxRpcSchema>(
      {
        method: 'debug_traceTransaction',
        params: [
          txHash,
          {
            tracer: 'callTracer',
            tracerConfig: {
              onlyTopCall: false,
              withLog: true,
            },
          },
        ],
      },
      { retryCount: 0 },
    ),
  )
  if (error) {
    const custom = coerceUnsupportedTraceError(
      'debug_traceTransaction',
      'traceTransactionHash',
      error,
      { chainId: client.chain?.id, chainName: client.chain?.name },
    )
    if (custom) return safeError(custom)

    return safeError(
      getTransactionError(error as BaseError, {
        account: null,
        chain: client.chain,
      }),
    )
  }

  const [fetchError] = await safeTry(() => cache.prefetchAllAbisFromCall(trace))
  return fetchError ? safeError(fetchError) : safeResult(trace)
}
