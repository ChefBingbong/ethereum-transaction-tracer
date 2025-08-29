import { LogVerbosity, TransactionTracer } from '@evm-tt/tracer'
import { type Chain, createPublicClient, http } from 'viem'
import { getConfigDir } from '../configCli/env'
import type { traceTxArgs } from '../configCli/schema'

export function makeClient(rpc: string, chainId: number) {
  return createPublicClient({
    transport: http(rpc),
    chain: { id: chainId } as Chain,
  })
}

export function makeTracer(args: traceTxArgs) {
  const client = makeClient(args.rpc, Number(args.chainId))
  const verbosity = LogVerbosity[args.verbosity]

  return new TransactionTracer(client, {
    cachePath: args.cachePath ?? getConfigDir(),
    showProgressBar: true,
    cacheOptions: {
      etherscanApiKey: args.etherscanKey,
    },
    verbosity,
  })
}

export function loadOverrides(path?: string) {
  if (!path) return undefined
  const resolved = require('node:path').resolve(String(path))
  const json = require(resolved)
  return json
}
