import type {
  Account,
  Address,
  BlockTag,
  ExactPartial,
  Hex,
  PrepareTransactionRequestParameters,
  RpcTransactionRequest,
} from 'viem'
import type { Environment } from '../callTracer/client/types'
import type { AbiCache, CacheOptions } from './types.cache'

export type TraaceOptions = {
  cachePath: string
  cacheOptions?: CacheOptions
  verbosity?: LogVerbosity
}
export type PrinterArgs = {
  verbosity: LogVerbosity
  cache: AbiCache
}

export enum LogVerbosity {
  Low = 0,
  Medium = 1,
  High = 2,
  Highest = 3,
}
export type RpcCallType =
  | 'CALL'
  | 'STATICCALL'
  | 'DELEGATECALL'
  | 'CREATE'
  | 'CREATE2'
  | 'SELFDESTRUCT'
  | 'CALLCODE'

export type RpcLogTrace = {
  address: Address
  data: Hex
  position: Hex
  topics: [Hex, ...Hex[]]
}

export type RpcCallTrace = {
  from: Address
  gas: Hex
  gasUsed: Hex
  to: Address
  input: Hex
  output: Hex
  error?: string
  revertReason?: string
  calls?: RpcCallTrace[]
  logs?: RpcLogTrace[]
  value?: Hex
  type: RpcCallType
}

export type StateOverrides = {
  [x: Address]: { stateDiff: Record<Address, Address> } | { balance: bigint }
}
export type TraceCallRpcSchema = {
  Method: 'debug_traceCall'
  Parameters:
    | [ExactPartial<RpcTransactionRequest>, Hex | BlockTag]
    | [
        ExactPartial<RpcTransactionRequest>,
        BlockTag | Hex,
        {
          tracer: 'callTracer' | 'prestateTracer'
          tracerConfig?: { onlyTopCall?: boolean; withLog?: boolean }
          stateOverride?: StateOverrides
        },
      ]
  ReturnType: RpcCallTrace
}

export type TraceTxRpcSchema = {
  Method: 'debug_traceTransaction'
  Parameters: [
    Hex,
    {
      tracer: 'callTracer' | 'prestateTracer'
      tracerConfig?: { onlyTopCall?: boolean; withLog?: boolean }
    },
  ]
  ReturnType: RpcCallTrace
}

export type TraceCallParameters = PrepareTransactionRequestParameters & {
  tracerOps: TracerOps
  account?: Account | Address | undefined
  stateOverride?: StateOverrides
} & (
    | { blockNumber?: bigint | undefined; blockTag?: undefined }
    | { blockNumber?: undefined; blockTag?: BlockTag | undefined }
  )

export type TracerOps = {
  env?: Environment
  cache: CacheOptions & { cachePath: string }
}

export type TraceTxParameters = {
  txHash: Hex
  tracerOps: TracerOps
}

export type TraceResult = {
  traceRaw: RpcCallTrace
  traceFormatted: string | undefined
}
