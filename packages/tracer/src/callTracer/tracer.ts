import { safeError, safeResult, safeTry } from '@evm-tt/utils'
import { ProgressBar } from '@opentf/cli-pbar'
import {
  type BaseError,
  formatTransactionRequest,
  numberToHex,
  type PublicClient,
  type TransactionRequest,
} from 'viem'
import { extract, getTransactionError, parseAccount } from 'viem/utils'
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
  private progressBar: ProgressBar | undefined
  private pbCount = 0

  constructor(client: PublicClient, args: TraaceOptions) {
    this.client = client
    this.chainId = client.chain?.id

    if (!this.chainId) {
      throw new Error('[Tracer]: Unable to detect chainId from client')
    }

    this.cache = new TracerCache(this.chainId, args.cachePath, args.cacheOptions)
    this.decoder = new Decoder(this.cache)
    this.printer = new TracePrettyPrinter(
      this.cache,
      this.decoder,
      args.verbosity ?? LogVerbosity.Highest,
    )
    if (args.showProgressBar) {
      this.progressBar = new ProgressBar({
        prefix: 'tracing Transaction',
        showPercent: false,
        showCount: true,
      })
      this.pbCount = 0
    }
    this.cache.load()
  }

  private callTraceRequest = async ({ stateOverride, ...args }: TraceCallParameters) => {
    const account_ = args.account ?? this.client.account
    const account = account_ ? parseAccount(account_) : null

    const [error, txRequest] = await safeTry(() =>
      this.client.prepareTransactionRequest({
        ...args,
        stateOverride,
        parameters: ['blobVersionedHashes', 'chainId', 'fees', 'nonce', 'type'],
      }),
    )

    this.updateProgressBar(2)

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
      to: tx.to,
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
              tracer: 'callTracer',
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

    this.updateProgressBar(2)

    const calls = this.cache.getUnknownAbisFromCall(trace)
    const [fetchError, _] = await safeTry(() => {
      return this.cache.prefetchUnknownAbis(calls, this.updateProgressBar)
    })

    this.stopProgressBar()

    return fetchError ? safeError(fetchError) : safeResult(trace)
  }

  private callTraceTxHash = async ({ txHash }: TraceTxParameters) => {
    const [error, trace] = await safeTry(() =>
      this.client.request<TraceTxRpcSchema>(
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
    this.updateProgressBar(6)

    if (error) {
      return safeError(
        getTransactionError(error as BaseError, {
          account: null,
          chain: this.client.chain,
        }),
      )
    }

    const calls = this.cache.getUnknownAbisFromCall(trace)
    const [fetchError, _] = await safeTry(() => {
      return this.cache.prefetchUnknownAbis(calls, this.updateProgressBar)
    })

    this.stopProgressBar()

    return fetchError ? safeError(fetchError) : safeResult(trace)
  }

  public traceCall = async ({ stateOverride, ...args }: TraceCallParameters) => {
    this.startProgressBar()
    const [traceError, trace] = await this.callTraceRequest({
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
        onUpdate: (value: number) => {
          if (args.showProgressBar) {
            this.updateProgressBar(value)
          }
        },
        includeLogs: true,
      },
    })
    return formatError ? safeError(formatError) : safeResult(_)
  }

  public traceTransactionHash = async ({ txHash }: TraceTxParameters) => {
    this.startProgressBar()
    const [error, trace] = await this.callTraceTxHash({
      txHash,
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

  public traceGasCall = async ({ stateOverride, ...args }: TraceCallParameters) => {
    this.startProgressBar()
    const [traceError, trace] = await this.callTraceRequest({
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

  public traceGasFromTransactionHash = async ({ txHash }: TraceTxParameters) => {
    this.startProgressBar()
    const [error, trace] = await this.callTraceTxHash({ txHash })

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

  private updateProgressBar = (value: number) => {
    if (!this.progressBar) return
    this.progressBar.update({ value: this.pbCount })
    this.pbCount += value
  }

  private stopProgressBar = () => {
    if (!this.progressBar) return
    this.progressBar.update({ value: 100 })
    this.progressBar.stop()
  }

  private startProgressBar = () => {
    if (!this.progressBar) return
    this.progressBar.start({ total: 100 })
  }
}
