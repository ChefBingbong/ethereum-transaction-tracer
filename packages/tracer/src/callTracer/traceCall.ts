import { safeError, safeResult, safeTry } from '@evm-tt/utils'
import {
  type BaseError,
  formatTransactionRequest,
  numberToHex,
  type PublicClient,
} from 'viem'
import { extract, getTransactionError, parseAccount } from 'viem/utils'
import {
  type AbiCache,
  createAbiCache,
  getAllUnknownSignatures,
  getUnknownAbisFromCall,
} from '../cache'
import { coerceUnsupportedTraceError } from '../errors'
import { printCallTrace } from '../print'
import {
  LogVerbosity,
  type TraceCallParameters,
  type TraceCallRpcSchema,
} from '../types'
import { traceWithCustomClient } from './client/clientProvider'
import type { TraceClient } from './client/types'

export const traceCall = async (
  {
    stateOverride,
    tracerOps: { run, cache: cacheOptions },
    ...args
  }: TraceCallParameters,
  client: PublicClient,
) => {
  return traceWithCustomClient({
    env: run.env ?? { kind: 'rpc' },
    client,
    traceCallback: async (client) => {
      const cache = createAbiCache(
        client.chain?.id!,
        cacheOptions.cachePath,
        cacheOptions,
      )

      const [traceError, trace] = await callTraceRequest(
        { stateOverride, tracerOps: { run, cache: cacheOptions }, ...args },
        client,
        cache,
      )
      if (traceError) return safeError(traceError)

      const [formatError, lines] = await printCallTrace(trace, {
        cache,
        verbosity: LogVerbosity.Highest,
        logStream: !!run.streamLogs,
        showReturnData: true,
        showLogs: true,
        gasProfiler: false,
      })

      const out = { traceRaw: trace, traceFormatted: lines }
      return formatError ? safeError(formatError) : safeResult(out)
    },
  })
}

const callTraceRequest = async (
  { stateOverride, ...args }: TraceCallParameters,
  client: TraceClient,
  cache: AbiCache,
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

  const calls = getUnknownAbisFromCall(cache.cache, trace)
  const [fetchSigError] = await safeTry(() =>
    getAllUnknownSignatures(cache.cache, trace),
  )
  if (fetchSigError) return safeError(fetchSigError)

  const [fetchError] = await safeTry(() => cache.prefetchUnknownAbis(calls))
  return fetchError ? safeError(fetchError) : safeResult(trace)
}
