import {
  BaseError,
  formatTransactionRequest,
  numberToHex,
  type PublicClient,
  type TransactionRequest,
} from 'viem'
import {
  extract,
  getTransactionError,
  parseAccount,
  recoverAuthorizationAddress,
} from 'viem/utils'
import { type CacheOptions, TracerCache } from '../cache'
import type {
  TraceCallParameters,
  TraceCallRpcSchema,
  TraceTxParameters,
  TraceTxRpcSchema,
} from './types'

export class TransactionTracer {
  public cache: TracerCache
  private client: PublicClient

  constructor(
    client: PublicClient,
    args: { cachePath: string; cacheOptions?: CacheOptions },
  ) {
    this.client = client
    this.cache = new TracerCache(args.cachePath, args.cacheOptions)
  }

  public init = async () => {
    await this.cache.load()
  }

  public traceCall = async ({
    tracer = 'callTracer',
    tracerConfig,
    stateOverride,
    ...args
  }: TraceCallParameters) => {
    const account_ = args.account ?? this.client.account
    const account = account_ ? parseAccount(account_) : null

    try {
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
      } = (await this.client.prepareTransactionRequest({
        ...args,
        parameters: ['blobVersionedHashes', 'chainId', 'fees', 'nonce', 'type'],
      })) as TraceCallParameters

      const blockNumberHex = blockNumber ? numberToHex(blockNumber) : undefined
      const block = blockNumberHex || blockTag

      const to = await (async () => {
        if (tx.to) return tx.to
        if (authorizationList && authorizationList.length > 0)
          return await recoverAuthorizationAddress({
            authorization: authorizationList[0],
          }).catch(() => {
            throw new BaseError(
              '`to` is required. Could not infer from `authorizationList`',
            )
          })

        return undefined
      })()

      const chainFormat =
        this.client.chain?.formatters?.transactionRequest?.format
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

      const trace = await this.client.request<TraceCallRpcSchema>(
        {
          method: 'debug_traceCall',
          params: [
            request,
            block,
            {
              tracer,
              ...(tracerConfig && { tracerConfig }),
              ...(stateOverride && { stateOverride }),
            },
          ],
        },
        { retryCount: 0 },
      )

      return trace
    } catch (err) {
      throw getTransactionError(err as BaseError, {
        ...args,
        account,
        chain: this.client.chain,
      })
    }
  }

  public traceTransactionHash = async ({
    txHash,
    tracer = 'callTracer',
    tracerConfig,
  }: TraceTxParameters) => {
    try {
      const trace = await this.client.request<TraceTxRpcSchema>(
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
      )
      return trace
    } catch (err) {
      throw getTransactionError(err as BaseError, {
        account: null,
        chain: this.client.chain,
      })
    }
  }
}
