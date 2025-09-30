import { makeProgress, safeError, safeResult, safeTry } from '@evm-tt/utils'
import type { BaseError, PublicClient } from 'viem'
import { getTransactionError } from 'viem/utils'
import { TracerCache } from '../cache'
import { coerceUnsupportedTraceError } from '../errors'
import { printCallTrace } from '../print'
import {
  LogVerbosity,
  type TraceTxParameters,
  type TraceTxRpcSchema,
} from '../types'
import { withClient } from './client/clientProvider'
import type { TraceClient } from './client/types'

export const traceTransactionHash = async (
  { run, cache: cacheOptions, txHash }: TraceTxParameters,
  client: PublicClient,
) => {
  const progress = makeProgress(run.showProgressBar)
  const cache = new TracerCache(
    client.chain?.id!,
    cacheOptions.cachePath,
    cacheOptions,
  )
  return withClient({ kind: 'rpc' }, progress, client, async (client) => {
    const [traceError, trace] = await callTraceTxHash(
      { txHash, run, cache: cacheOptions },
      client,
      cache,
      progress,
    )
    if (traceError) return safeError(traceError)

    const [formatError, lines] = await printCallTrace(trace, {
      cache,
      verbosity: LogVerbosity.Highest,
      logStream: !!run.streamLogs,
      showReturnData: true,
      showLogs: true,
      gasProfiler: false,
      progress: {
        onUpdate: (v: number) => progress.inc(v),
        includeLogs: true,
      },
    })

    const out = { traceRaw: trace, traceFormatted: lines }
    return formatError ? safeError(formatError) : safeResult(out)
  })
}

const callTraceTxHash = async (
  { txHash }: TraceTxParameters,
  client: TraceClient,
  cache: TracerCache,
  progress: ReturnType<typeof makeProgress>,
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
  progress.inc(6)

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

  progress.inc(2)

  const calls = cache.getUnknownAbisFromCall(trace)
  await cache.getAllUnknownSignatures(trace)
  const [fetchError] = await safeTry(() =>
    cache.prefetchUnknownAbis(calls, (v) => progress.inc(v)),
  )

  return fetchError ? safeError(fetchError) : safeResult(trace)
}
