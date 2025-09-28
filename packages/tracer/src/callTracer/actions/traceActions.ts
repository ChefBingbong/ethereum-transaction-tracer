import type { SafePromise } from '@evm-tt/utils'
import type { PublicClient } from 'viem'
import type {
  RpcCallTrace,
  TraceCallParameters,
  TraceTxParameters,
} from '../../types'
import { traceCall } from '../traceCall'
import { traceTransactionHash } from '../traceTransaction'

export type TraceActions = {
  /**
   * Traces a Tx onChain.
   *
   * @param args - {@link TraceCallParameters}
   *
   * @example
   * import { createClient, http } from 'viem'
   * import { mainnet } from 'viem/chains'
   * import { traceActions } from 'viem-tracer'
   *
   * const client = createClient({
   *   chain: mainnet,
   *   transport: http(),
   * }).extend(traceActions)
   * await client.traceTransactionHash({
   *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
   *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
   *   value: parseEther('1'),
   * })
   */
  traceTransactionHash: (args: TraceTxParameters) => SafePromise<{
    traceRaw: RpcCallTrace
    traceFormatted: string | undefined
  }>
  /**
   * Traces a call.
   *
   * @param args - {@link TraceCallParameters}
   *
   * @example
   * import { createClient, http } from 'viem'
   * import { mainnet } from 'viem/chains'
   * import { traceActions } from 'viem-tracer'
   *
   * const client = createClient({
   *   chain: mainnet,
   *   transport: http(),
   * }).extend(traceActions)
   * await client.traceCall({
   *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
   *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
   *   value: parseEther('1'),
   * })
   */
  traceCall: (args: TraceCallParameters) => SafePromise<{
    traceRaw: RpcCallTrace
    traceFormatted: string | undefined
  }>
}

export function traceActions(client: PublicClient): TraceActions {
  return {
    traceCall: (args) => traceCall(args, client),
    traceTransactionHash: (args) => traceTransactionHash(args, client),
  }
}
