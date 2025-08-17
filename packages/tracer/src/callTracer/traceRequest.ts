import {
  BaseError,
  type Chain,
  formatTransactionRequest,
  numberToHex,
  type PublicClient,
  type TransactionRequest,
} from 'viem'
import { prepareTransactionRequest } from 'viem/actions'
import {
  extract,
  getTransactionError,
  parseAccount,
  recoverAuthorizationAddress,
} from 'viem/utils'
import type {
  RpcCallTrace,
  TraceCallParameters,
  TraceCallRpcSchema,
  TraceTxRpcSchema,
} from './types'

export async function traceCall<chain extends Chain | undefined>(
  client: PublicClient,
  {
    txHash,
    tracer = 'callTracer',
    tracerConfig,
    stateOverride,
    ...args
  }: TraceCallParameters<chain>,
) {
  const account_ = args.account ?? client.account
  const account = account_ ? parseAccount(account_) : null

  let trace: RpcCallTrace
  if (txHash) {
    trace = await client.request<TraceTxRpcSchema>(
      {
        method: 'debug_traceTransaction',
        params: [
          txHash,
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
  } else {
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
      } = (await prepareTransactionRequest(client, {
        ...(args as any),
        parameters: ['blobVersionedHashes', 'chainId', 'fees', 'nonce', 'type'],
      })) as TraceCallParameters

      const blockNumberHex = blockNumber ? numberToHex(blockNumber) : undefined
      const block = blockNumberHex || blockTag

      const to = await (async () => {
        if (tx.to) return tx.to
        if (authorizationList && authorizationList.length > 0)
          return await recoverAuthorizationAddress({
            authorization: authorizationList[0]!,
          }).catch(() => {
            throw new BaseError(
              '`to` is required. Could not infer from `authorizationList`',
            )
          })

        return undefined
      })()

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
        to,
        value,
        stateOverride,
      } as TransactionRequest)

      trace = await client.request<TraceCallRpcSchema>(
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
        chain: client.chain,
      })
    }
  }
}
