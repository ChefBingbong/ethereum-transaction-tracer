import { BaseError } from 'viem'

type TraceMethod = 'debug_traceTransaction' | 'debug_traceCall'
type CallSite = 'traceTransactionHash' | 'traceCall'

export class UnsupportedTraceMethodError extends BaseError {
  override name = 'UnsupportedTraceMethodError'
  shortMessage: string
  details: string
  metaMessages?: string[]

  constructor(args: {
    method: TraceMethod
    callSite: CallSite
    providerUrl?: string
    chainId?: number
    chainName?: string
    cause?: unknown
  }) {
    const short = `Your RPC provider does not support ${args.method}.`
    const suggestions =
      args.callSite === 'traceCall'
        ? [
            'Use a local fork environment (e.g., Anvil or Hardhat) via `env: { kind: "fork", ... }` in your run options.',
            'Or switch to a provider that supports tracing (e.g., Alchemy).',
          ]
        : [
            'Switch to a provider that supports `debug_traceTransaction` (e.g., Alchemy).',
            'Or run a local fork (Anvil/Hardhat) and use `traceCall` with `env: { kind: "fork", ... }`.',
          ]

    const message = short

    super(message, args.cause as any)

    this.shortMessage = short
    this.metaMessages = suggestions.map((s) => `  • ${s}`)
    this.details =
      'The upstream RPC returned a “method not supported” style error.'
  }
}

/**
 * If the error looks like “method not supported” for the given trace method,
 * return an UnsupportedTraceMethodError. Otherwise, return undefined.
 */
export function coerceUnsupportedTraceError(
  method: TraceMethod,
  callSite: CallSite,
  err: unknown,
  ctx?: { providerUrl?: string; chainId?: number; chainName?: string },
): UnsupportedTraceMethodError | undefined {
  const haystack = [
    // viem error shapes
    (err as any)?.details,
    (err as any)?.shortMessage,
    (err as any)?.message,
    // nested cause (RpcError/InternalRpcError/etc.)
    (err as any)?.cause?.details,
    (err as any)?.cause?.shortMessage,
    (err as any)?.cause?.message,
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()

  const code = (err as any)?.code ?? (err as any)?.cause?.code

  const looksUnsupported =
    code === -32601 || // JSON-RPC "Method not found"
    /method .*not supported/.test(haystack) ||
    /method .*does not exist/.test(haystack) ||
    /unsupported method/.test(haystack) ||
    /not implemented/.test(haystack) ||
    /not enabled/.test(haystack) ||
    /trace.*not (supported|available)/.test(haystack)

  if (!looksUnsupported) return undefined

  return new UnsupportedTraceMethodError({
    method,
    callSite,
    providerUrl: ctx?.providerUrl,
    chainId: ctx?.chainId,
    chainName: ctx?.chainName,
    cause: err,
  })
}
