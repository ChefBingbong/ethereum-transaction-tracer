import type {
  Account,
  Address,
  BlockTag,
  Chain,
  ExactPartial,
  FormattedTransactionRequest,
  Hex,
  RpcTransactionRequest,
  StateOverride,
  UnionOmit,
} from 'viem'

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
          stateOverride?: StateOverride
        },
      ]
  ReturnType: RpcCallTrace
}

export type TraceTxRpcSchema = {
  Method: 'debug_traceTransaction'
  Parameters: [
    /* tx hash */ Hex,
    /* opts    */ {
      tracer: 'callTracer' | 'prestateTracer'
      tracerConfig?: { onlyTopCall?: boolean; withLog?: boolean }
    },
  ]
  ReturnType: RpcCallTrace
}

export type TraceCallParameters<
  chain extends Chain | undefined = Chain | undefined,
> = UnionOmit<FormattedTransactionRequest<chain>, 'from'> & {
  account?: Account | Address | undefined
  txHash?: Hex
  tracer?: 'callTracer' | 'prestateTracer'
  tracerConfig?: { onlyTopCall?: boolean; withLog?: boolean } // ← add withLog
  stateOverride?: StateOverride
} & (
    | { blockNumber?: bigint | undefined; blockTag?: undefined }
    | { blockNumber?: undefined; blockTag?: BlockTag | undefined }
  )

export type TraceTxParameters = {
  txHash: Hex
  tracer?: 'callTracer' | 'prestateTracer'
  tracerConfig?: { onlyTopCall?: boolean; withLog?: boolean }
}
