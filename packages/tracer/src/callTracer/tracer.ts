import { safeError, safeResult, safeTry } from '@evm-tt/utils'
import { ProgressBar } from '@opentf/cli-pbar'
import { type Anvil, createAnvil } from '@viem/anvil'
import {
  type BaseError,
  type Client,
  createTestClient,
  formatTransactionRequest,
  http,
  numberToHex,
  type PublicClient,
  publicActions,
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
  private testClient: Client
  private progressBar: ProgressBar | undefined
  private verbosity = LogVerbosity.Highest
  private anvil: Anvil
  private pbCount = 0

  constructor(client: PublicClient, args: TraaceOptions) {
    this.client = client
    this.chainId = client.chain?.id
    if (args.verbosity) this.verbosity = args.verbosity

    if (!this.chainId) {
      throw new Error('[Tracer]: Unable to detect chainId from client')
    }

    this.anvil = createAnvil({
      chainId: this.chainId,
      forkUrl: this.client.chain?.rpcUrls.default.http[0],
    })

    this.testClient = createTestClient({
      chain: this.client.chain,
      mode: 'anvil',
      transport: http(`http://${this.anvil.host}:${this.anvil.port}`, {
        timeout: 60000,
      }),
    }).extend(publicActions)

    this.cache = new TracerCache(
      this.chainId,
      args.cachePath,
      args.cacheOptions,
    )
    this.decoder = new Decoder(this.cache)
    if (args.showProgressBar) {
      this.progressBar = new ProgressBar({
        prefix: 'tracing Transaction',
        showPercent: false,
        showCount: true,
      })
      this.pbCount = 0
    }
  }

  public traceCall = async ({
    stateOverride,
    gasProfiler = false,
    ...args
  }: TraceCallParameters) => {
    this.startProgressBar()
    if (args.useAnvil) await this.anvil.start()
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
    const printer = TracePrettyPrinter.createTracer(this.cache, this.decoder, {
      verbosity: this.verbosity,
      logStream: !!args.streamLogs,
    })

    const [formatError, lines] = await printer.formatTrace(trace, {
      showReturnData: true,
      showLogs: true,
      gasProfiler,
      progress: {
        onUpdate: (value: number) => {
          if (args.showProgressBar) {
            this.updateProgressBar(value)
          }
        },
        includeLogs: true,
      },
    })
    return formatError ? safeError(formatError) : safeResult(lines)
  }

  public traceTransactionHash = async ({
    txHash,
    showProgressBar,
    streamLogs,
    gasProfiler,
  }: TraceTxParameters) => {
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
    const printer = TracePrettyPrinter.createTracer(this.cache, this.decoder, {
      verbosity: this.verbosity,
      logStream: !!streamLogs,
    })
    const [formatError, lines] = await printer.formatTrace(trace, {
      showReturnData: true,
      showLogs: true,
      gasProfiler: !!gasProfiler,
      progress: {
        onUpdate: (value: number) => {
          if (showProgressBar) {
            this.updateProgressBar(value)
          }
        },
        includeLogs: true,
      },
    })

    return formatError ? safeError(formatError) : safeResult(lines)
  }

  private callTraceRequest = async ({
    stateOverride,
    ...args
  }: TraceCallParameters) => {
    const client = args.useAnvil ? this.testClient : this.client
    const account_ = args.account ?? client.account
    const account = account_ ? parseAccount(account_) : null

    const [error, txRequest] = await safeTry(() =>
      (client as PublicClient).prepareTransactionRequest({
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
      to: tx.to,
      value,
      stateOverride,
    } as TransactionRequest)

    const [traceError, trace] = await safeTry(() =>
      client.request<TraceCallRpcSchema>(
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
