import { makeProgress, safeError, safeResult, safeTry } from '@evm-tt/utils'
import {
  type BaseError,
  formatTransactionRequest,
  numberToHex,
  type PublicClient,
} from 'viem'
import { extract, getTransactionError, parseAccount } from 'viem/utils'
import { TracerCache } from '../cache'
import { coerceUnsupportedTraceError } from '../errors'
import { printCallTrace } from '../print'
import {
  LogVerbosity,
  type TraceCallParameters,
  type TraceCallRpcSchema,
} from '../types'
import { withClient } from './client/clientProvider'
import type { TraceClient } from './client/types'

export const traceCall = async (
  { stateOverride, run, cache: cacheOptions, ...args }: TraceCallParameters,
  client: PublicClient,
) => {
  const progress = makeProgress(run.showProgressBar)
  const cache = new TracerCache(
    client.chain?.id!,
    cacheOptions.cachePath,
    cacheOptions,
  )
  return withClient(
    run.env ?? { kind: 'rpc' },
    progress,
    client,
    async (client) => {
      const [traceError, trace] = await callTraceRequest(
        { stateOverride, run, cache: cacheOptions, ...args },
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
    },
  )
}

const callTraceRequest = async (
  { stateOverride, ...args }: TraceCallParameters,
  client: TraceClient,
  cache: TracerCache,
  progress: ReturnType<typeof makeProgress>,
) => {
  const account_ = args.account ?? client.account
  const account = account_ ? parseAccount(account_) : null

  const [error, txRequest] = await safeTry(() =>
    client.prepareTransactionRequest({
      ...args,
      stateOverride,
      parameters: ['blobVersionedHashes', 'chainId', 'fees', 'nonce', 'type'],
    }),
  )
  progress.inc(2)

  if (error) {
    const custom = coerceUnsupportedTraceError(
      'debug_traceCall',
      'traceCall',
      error,
      {
        chainId: client.chain?.id,
        chainName: client.chain?.name,
      },
    )
    if (custom) return safeError(custom)

    return safeError(
      getTransactionError(error as BaseError, {
        ...args,
        account: null,
        chain: client.chain,
      }),
    )
  }

  const {
    accessList,
    authorizationList,
    blobs,
    blobVersionedHashes,
    data,
    gas,
    gasPrice,
    maxFeePerBlobGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    value,
    ...tx
  } = txRequest

  const blockNumberHex = args?.blockNumber
    ? numberToHex(args?.blockNumber)
    : undefined
  const block = blockNumberHex ?? 'latest'

  const chainFormat = client.chain?.formatters?.transactionRequest?.format
  const format = chainFormat || formatTransactionRequest

  const request = format({
    ...extract(tx, { format: chainFormat }),
    from: account?.address,
    accessList,
    authorizationList,
    blobs,
    blobVersionedHashes,
    data,
    gas,
    gasPrice,
    maxFeePerBlobGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    to: tx?.to,
    value,
    stateOverride,
  } as any)

  const [traceError, trace] = await safeTry(() =>
    client.request<TraceCallRpcSchema>(
      {
        method: 'debug_traceCall',
        params: [
          request,
          block,
          {
            tracer: 'callTracer',
            tracerConfig: { onlyTopCall: false, withLog: true },
            ...(stateOverride && { stateOverrides: { ...stateOverride } }),
          },
        ],
      },
      { retryCount: 0 },
    ),
  )

  if (traceError) {
    const custom = coerceUnsupportedTraceError(
      'debug_traceCall',
      'traceCall',
      traceError,
      {
        chainId: client.chain?.id,
        chainName: client.chain?.name,
      },
    )
    if (custom) return safeError(custom)

    return safeError(
      getTransactionError(traceError as BaseError, {
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
