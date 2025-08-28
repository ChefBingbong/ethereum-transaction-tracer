import { LogVerbosity, TransactionTracer } from '@evm-tt/tracer'
import { type Chain, createPublicClient, http } from 'viem'
import z from 'zod'
import { getConfigDir } from '../configCli/env'
import { baseTraceSchema } from '../configCli/schema'

export function makeClient(rpc: string, chainId: number) {
  return createPublicClient({ transport: http(rpc), chain: { id: chainId } as Chain })
}

export function makeTracer<T extends z.infer<typeof baseTraceSchema>>(args: T) {
  const client = makeClient(args.rpc, Number(args.chainId))
  const verbosity = LogVerbosity[args.verbosity]

  const tracer = new TransactionTracer(client, {
    cachePath: getConfigDir(),
    showProgressBar: true,
    cacheOptions: {
      etherscanApiKey: args.etherscanKey,
    },
    verbosity,
  })
  return { tracer, client }
}

export function loadOverrides(path?: string) {
  if (!path) return undefined
  const resolved = require('node:path').resolve(String(path))
  const json = require(resolved)
  return json
}
