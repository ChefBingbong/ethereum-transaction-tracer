import { makeProgress, safeError, safeResult, safeTry } from '@evm-tt/utils'
import {
  type BaseError,
  formatTransactionRequest,
  numberToHex,
  type PublicClient,
} from 'viem'
import { extract, getTransactionError, parseAccount } from 'viem/utils'
import { TracerCache } from '../cache'
import { Decoder } from '../decoder'
import { coerceUnsupportedTraceError } from '../errors'
import { TracePrettyPrinter } from '../format'
import {
  LogVerbosity,
  type TraaceOptions,
  type TraceCallParameters,
  type TraceCallRpcSchema,
  type TraceTxParameters,
  type TraceTxRpcSchema,
} from '../types'
import {
  type ClientProvider,
  DefaultClientProvider,
  type Environment,
} from './clientProvider'

type TraceClient = PublicClient

export class TransactionTracer {
  public cache: TracerCache
  public decoder: Decoder
  public chainId?: number
  private provider: ClientProvider
  private verbosity = LogVerbosity.Highest

  constructor(base: PublicClient | ClientProvider, args: TraaceOptions) {
    this.provider = isProvider(base) ? base : new DefaultClientProvider(base)
    this.chainId = !isProvider(base) ? base.chain?.id : undefined
    if (!this.chainId) throw new Error('[Tracer]: Unable to detect chainId')
    if (args.verbosity) this.verbosity = args.verbosity

    this.cache = new TracerCache(
      this.chainId,
      args.cachePath,
      args.cacheOptions,
    )
    this.decoder = new Decoder(this.cache)
  }

  public traceCall = async (
    { stateOverride, ...args }: TraceCallParameters,
    run: {
      env?: Environment
      showProgressBar?: boolean
      streamLogs?: boolean
      gasProfiler?: boolean
    } = {},
  ) => {
    const progress = makeProgress(run.showProgressBar)
    return this.withClient(
      run.env ?? { kind: 'rpc' },
      progress,
      async (client) => {
        const [traceError, trace] = await this.callTraceRequest(
          client,
          { stateOverride, ...args },
          progress,
        )
        if (traceError) {
          return safeError(new Error(traceError.message))
        }

        const printer = TracePrettyPrinter.createTracer(
          this.cache,
          this.decoder,
          {
            verbosity: this.verbosity,
            logStream: !!run.streamLogs,
          },
        )

        const [formatError, lines] = await printer.formatTrace(trace, {
          showReturnData: true,
          showLogs: true,
          gasProfiler: !!run.gasProfiler,
          progress: {
            onUpdate: (v: number) => progress.inc(v),
            includeLogs: true,
          },
        })

        return formatError ? safeError(formatError) : safeResult(lines)
      },
    )
  }

  public traceTransactionHash = async (
    { txHash }: TraceTxParameters,
    run: {
      showProgressBar?: boolean
      streamLogs?: boolean
      gasProfiler?: boolean
    } = {},
  ) => {
    const progress = makeProgress(run.showProgressBar)
    return this.withClient({ kind: 'rpc' }, progress, async (client) => {
      const [traceError, trace] = await this.callTraceTxHash(
        client,
        { txHash },
        progress,
      )
      if (traceError) {
        return safeError(new Error(traceError.message))
      }

      const printer = TracePrettyPrinter.createTracer(
        this.cache,
        this.decoder,
        {
          verbosity: this.verbosity,
          logStream: !!run.streamLogs,
        },
      )

      const [formatError, lines] = await printer.formatTrace(trace, {
        showReturnData: true,
        showLogs: true,
        gasProfiler: !!run.gasProfiler,
        progress: {
          onUpdate: (v: number) => progress.inc(v),
          includeLogs: true,
        },
      })

      return formatError ? safeError(formatError) : safeResult(lines)
    })
  }

  private async withClient<T>(
    env: Environment,
    progress: ReturnType<typeof makeProgress>,
    fn: (client: TraceClient) => Promise<T>,
  ): Promise<T> {
    const lease = await this.provider.lease(env)
    try {
      return await fn(lease.client as TraceClient)
    } finally {
      progress.done()
      if (lease.dispose) await lease.dispose()
    }
  }

  private callTraceRequest = async (
    client: TraceClient,
    { stateOverride, ...args }: TraceCallParameters,
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
      blockNumber,
      blockTag = 'latest',
      data,
      gas,
      gasPrice,
      maxFeePerBlobGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      value,
      ...tx
    } = txRequest as TraceCallParameters

    const blockNumberHex = blockNumber ? numberToHex(blockNumber) : undefined
    const block = blockNumberHex || blockTag

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
      to: (tx as any).to,
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
      return safeError(traceError)
    }

    progress.inc(2)

    const calls = this.cache.getUnknownAbisFromCall(trace)
    const [fetchError] = await safeTry(() =>
      this.cache.prefetchUnknownAbis(calls, (v) => progress.inc(v)),
    )

    return fetchError ? safeError(fetchError) : safeResult(trace)
  }

  private callTraceTxHash = async (
    client: TraceClient,
    { txHash }: TraceTxParameters,
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

    const calls = this.cache.getUnknownAbisFromCall(trace)
    const [fetchError] = await safeTry(() =>
      this.cache.prefetchUnknownAbis(calls, (v) => progress.inc(v)),
    )

    return fetchError ? safeError(fetchError) : safeResult(trace)
  }
}

function isProvider(x: unknown): x is ClientProvider {
  return !!x && typeof (x as any).lease === 'function'
}
