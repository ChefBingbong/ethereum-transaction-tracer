import { BaseError, type PublicClient } from 'viem'
import type { RpcCallTrace, TraceTxParameters, TraceTxRpcSchema } from './types'

export async function traceTransaction(
  client: PublicClient,
  { txHash, tracer = 'callTracer', tracerConfig }: TraceTxParameters,
): Promise<RpcCallTrace> {
  try {
    const trace = await client.request<TraceTxRpcSchema>(
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
    throw new BaseError(
      `debug_traceTransaction failed for ${txHash}: ${(err as Error)?.message || err}`,
    )
  }
}
