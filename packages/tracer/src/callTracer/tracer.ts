import { safeError, safeResult, safeTry } from '@evm-transaction-trace/utils'
import {
  BaseError,
  formatTransactionRequest,
  numberToHex,
  type PublicClient,
  type TransactionRequest,
} from 'viem'
import { extract, getTransactionError, parseAccount, recoverAuthorizationAddress } from 'viem/utils'
import { TracerCache } from '../cache'
import { Decoder } from '../decoder'
import { TracePrettyPrinter } from '../format'
import {
  LogVerbosity,
  type TraaceOptions,
  type TraceCallParameters,
  type TraceCallRpcSchema,
  type TraceTxParameters,
  type TraceTxRpcSchema,
} from '../types'

export class TransactionTracer {
  public cache: TracerCache
  public decoder: Decoder
  public chainId?: number
  private client: PublicClient
  private printer: TracePrettyPrinter

  constructor(client: PublicClient, args: TraaceOptions) {
    this.client = client
    this.chainId = client.chain?.id

    if (!this.chainId) {
      throw new Error('[Tracer]: Unable to detect chainId from client')
    }

    this.cache = new TracerCache(this.chainId, args.cachePath, args.cacheOptions)
    this.decoder = new Decoder(this.cache, true)

    this.printer = new TracePrettyPrinter(
      this.cache,
      this.decoder,
      args.logDebug ?? false,
      (line) => console.log(line),
      args.verbosity ?? LogVerbosity.Highest,
    )
  }

  public init = async () => {
    await this.cache.load()
  }

  private callTraceRequest = async ({
    tracer = 'callTracer',
    stateOverride,
    ...args
  }: TraceCallParameters) => {
    const account_ = args.account ?? this.client.account
    const account = account_ ? parseAccount(account_) : null

    const [error, txRequest] = await safeTry(() =>
      this.client.prepareTransactionRequest({
        ...args,
        stateOverride,
        parameters: ['blobVersionedHashes', 'chainId', 'fees', 'nonce', 'type'],
      }),
    )

    if (error) {
      return safeError(
        getTransactionError(error as BaseError, {
          ...args,
          account,
          chain: this.client.chain,
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

    const to = await (async () => {
      if (tx.to) return tx.to
      if (authorizationList && authorizationList.length > 0)
        return await recoverAuthorizationAddress({
          authorization: authorizationList[0],
        }).catch(() => {
          throw new BaseError('`to` is required. Could not infer from `authorizationList`')
        })

      return undefined
    })()

    const chainFormat = this.client.chain?.formatters?.transactionRequest?.format
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
      to,
      value,
      stateOverride,
    } as TransactionRequest)

    const [traceError, trace] = await safeTry(() =>
      this.client.request<TraceCallRpcSchema>(
        {
          method: 'debug_traceCall',
          params: [
            request,
            block,
            {
              tracer,
              tracerConfig: {
                onlyTopCall: false,
                withLog: true,
              },
              ...(stateOverride && { stateOverrides: { ...stateOverride } }),
            },
          ],
        },
        { retryCount: 0 },
      ),
    )

    if (traceError) {
      return safeError(
        getTransactionError(traceError as BaseError, {
          ...args,
          account,
          chain: this.client.chain,
        }),
      )
    }

    const [fetchError, _] = await this.cache.prefetchTraceAbis(trace)
    if (fetchError) return safeError(fetchError)

    return safeResult(trace)
  }

  private callTraceTxHash = async ({
    txHash,
    tracer = 'callTracer',
    tracerConfig,
  }: TraceTxParameters) => {
    const [error, trace] = await safeTry(() =>
      this.client.request<TraceTxRpcSchema>(
        {
          method: 'debug_traceTransaction',
          params: [
            txHash,
            {
              tracer,
              ...(tracerConfig && { tracerConfig }),
            },
          ],
        },
        { retryCount: 0 },
      ),
    )

    if (error) {
      return safeError(
        getTransactionError(error as BaseError, {
          account: null,
          chain: this.client.chain,
        }),
      )
    }

    const [fetchError, _] = await this.cache.prefetchTraceAbis(trace)
    if (fetchError) return safeError(fetchError)

    return safeResult(trace)
  }

  public traceCall = async ({
    tracer = 'callTracer',
    tracerConfig,
    stateOverride,
    ...args
  }: TraceCallParameters) => {
    const [traceError, trace] = await this.callTraceRequest({
      tracer,
      stateOverride,
      ...args,
    })

    if (traceError) {
      return safeError(
        getTransactionError(traceError as BaseError, {
          ...args,
          account: null,
          chain: this.client.chain,
        }),
      )
    }

    const [formatError, _] = await this.printer.formatTraceColored(trace, {
      showReturnData: true,
      showLogs: true,
      progress: {
        onUpdate: () => null,
        includeLogs: true,
      },
    })
    return formatError ? safeError(formatError) : safeResult(_)
  }

  public traceTransactionHash = async ({
    txHash,
    tracer = 'callTracer',
    tracerConfig,
  }: TraceTxParameters) => {
    const [error, trace] = await this.callTraceTxHash({
      txHash,
      tracer,
      tracerConfig,
    })

    if (error) {
      return safeError(
        getTransactionError(error as BaseError, {
          account: null,
          chain: this.client.chain,
        }),
      )
    }

    const [formatError, _] = await this.printer.formatTraceColored(trace, {
      showReturnData: true,
      showLogs: true,
      progress: {
        onUpdate: () => null,
        includeLogs: true,
      },
    })

    return formatError ? safeError(formatError) : safeResult(_)
  }

  public traceGasCall = async ({
    tracer = 'callTracer',
    stateOverride,
    ...args
  }: TraceCallParameters) => {
    const [traceError, trace] = await this.callTraceRequest({
      tracer,
      stateOverride,
      ...args,
    })

    if (traceError) {
      return safeError(
        getTransactionError(traceError as BaseError, {
          ...args,
          account: null,
          chain: this.client.chain,
        }),
      )
    }

    const [formatError, _] = await this.printer.formatGasTraceColored(trace)
    return formatError ? safeError(formatError) : safeResult(_)
  }

  public traceGasFromTransactionHash = async ({
    txHash,
    tracer = 'callTracer',
  }: TraceTxParameters) => {
    const [error, trace] = await this.callTraceTxHash({ txHash, tracer })

    if (error) {
      return safeError(
        getTransactionError(error as BaseError, {
          account: null,
          chain: this.client.chain,
        }),
      )
    }

    const [formatError, _] = await this.printer.formatGasTraceColored(trace)
    return formatError ? safeError(formatError) : safeResult(_)
  }
}
