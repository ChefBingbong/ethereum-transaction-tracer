import { traceActions } from '@evm-tt/tracer'
import { type Chain, createPublicClient, http } from 'viem'
import type z from 'zod'
import type { baseTraceSchema } from '../configCli/schema'

export function makeClient(rpc: string, chainId: number) {
  return createPublicClient({
    transport: http(rpc),
    chain: { id: chainId } as Chain,
  }).extend(traceActions)
}

export function makeTracer<T extends z.infer<typeof baseTraceSchema>>(args: T) {
  const client = makeClient(args.rpc, Number(args.chainId))
  // const verbosity = LogVerbosity[args.verbosity]
  return client
}

export function loadOverrides(path?: string) {
  if (!path) return undefined
  const resolved = require('node:path').resolve(String(path))
  const json = require(resolved)
  return json
}
