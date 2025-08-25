import { LogVerbosity, TransactionTracer } from '@evm-tt/tracer'
import pc from 'picocolors'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { z } from 'zod'
import type { MiniCli } from './cli'

function makeClient(rpc: string, chainId?: number) {
  const chain = chainId ? { ...mainnet, id: chainId } : mainnet
  return createPublicClient({ chain, transport: http(rpc) })
}

function makeTracer(args: any) {
  const client = makeClient(args.rpc, args['chain-id'])
  const verbosity =
    LogVerbosity[(args.verbosity as keyof typeof LogVerbosity) ?? 'Normal'] ?? LogVerbosity.Medium

  const tracer = new TransactionTracer(client, {
    cachePath: args['cache-path'],
    cacheOptions: {
      etherscanApiKey: args['etherscan-key'],
    },
    verbosity,
  })
  return { client, tracer }
}

function loadOverrides(path?: string) {
  if (!path) return undefined
  const resolved = require('node:path').resolve(String(path))
  const json = require(resolved)
  return json
}

export function registerTasks(cli: MiniCli) {
  cli
    .task('traceTx', (t) => {
      t.describe('Trace a mined transaction by hash')
        .option({
          name: 'rpc',
          description: 'RPC URL (must support debug_trace*)',
          type: 'string',
          required: true,
        })
        .option({
          name: 'hash',
          description: 'Transaction hash (0x...)',
          type: 'string',
          required: true,
        })
        .option({ name: 'chain-id', description: 'Chain ID (default mainnet)', type: 'number' })
        .option({ name: 'cache-path', description: 'Persistent cache dir', type: 'string' })
        .option({
          name: 'etherscan-key',
          description: 'Explorer API key for ABI lookups',
          type: 'string',
        })
        .option({
          name: 'verbosity',
          description: 'Lowest|Low|Normal|High|Highest',
          type: 'string',
        })
    })
    .action(async (args) => {
      const schema = z.object({
        rpc: z.string().url(),
        hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
        'chain-id': z.number().optional(),
        'cache-path': z.string().optional(),
        'etherscan-key': z.string().optional(),
        verbosity: z.string().optional(),
      })
      const a = schema.parse(args)
      const { tracer } = makeTracer(a)
      const [err, res] = await tracer.traceTransactionHash({
        txHash: a.hash as `0x${string}`,
        tracer: 'callTracer',
      })
      if (err) {
        console.error(pc.red('✖ Trace failed:\n'), err)
        process.exit(1)
      }
      console.log(res)
    })

  cli
    .task('traceGasTx', (t) => {
      t.describe('Trace a mined tx with gas focus (same call today, flag for future)')
        .option({ name: 'rpc', type: 'string', required: true, description: 'RPC URL' })
        .option({ name: 'hash', type: 'string', required: true, description: 'Tx hash' })
        .option({ name: 'chain-id', type: 'number', description: 'Chain ID' })
        .option({ name: 'cache-path', type: 'string', description: 'Cache dir' })
        .option({ name: 'etherscan-key', type: 'string', description: 'Explorer key' })
        .option({
          name: 'verbosity',
          type: 'string',
          description: 'Lowest|Low|Normal|High|Highest',
        })
    })
    .action(async (args) => {
      const { tracer } = makeTracer(args)
      const [err, res] = await tracer.traceTransactionHash({
        txHash: args['hash'] as `0x${string}`,
        tracer: 'callTracer',
      })
      if (err) {
        console.error(pc.red('✖ Trace failed:\n'), err)
        process.exit(1)
      }
      console.log(res)
    })

  cli
    .task('traceRequest', (t) => {
      t.describe('Simulate calldata and trace (debug_traceCall)')
        .option({ name: 'rpc', type: 'string', required: true, description: 'RPC URL' })
        .option({ name: 'to', type: 'string', required: true, description: 'Target address' })
        .option({ name: 'data', type: 'string', required: true, description: 'Calldata 0x...' })
        .option({ name: 'from', type: 'string', description: 'From address' })
        .option({ name: 'state-file', type: 'string', description: 'Path to stateOverrides JSON' })
        .option({ name: 'chain-id', type: 'number', description: 'Chain ID' })
        .option({ name: 'cache-path', type: 'string', description: 'Cache dir' })
        .option({ name: 'etherscan-key', type: 'string', description: 'Explorer key' })
        .option({
          name: 'verbosity',
          type: 'string',
          description: 'Lowest|Low|Normal|High|Highest',
        })
    })
    .action(async (args) => {
      const s = z.object({
        rpc: z.string().url(),
        to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        data: z.string().regex(/^0x[a-fA-F0-9]*$/),
        from: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/)
          .optional(),
        'state-file': z.string().optional(),
        'chain-id': z.number().optional(),
        'cache-path': z.string().optional(),
        'etherscan-key': z.string().optional(),
        verbosity: z.string().optional(),
      })
      const a = s.parse(args)

      const { tracer, client } = makeTracer(a)
      const overrides = loadOverrides(a['state-file'])

      const [err, res] = await tracer.traceCall({
        to: a.to as `0x${string}`,
        data: a.data as `0x${string}`,
        account: (a.from ?? undefined) as `0x${string}` | undefined,
        chain: client.chain,
        tracer: 'callTracer',
        tracerConfig: { withLog: true },
        stateOverride: overrides as any,
      })

      if (err) {
        console.error(pc.red('✖ Trace failed:\n'), err)
        process.exit(1)
      }
      console.log(res)
    })

  cli
    .task('traceGasRequest', (t) => {
      t.describe('Simulate calldata and trace with gas focus')
        .option({ name: 'rpc', type: 'string', required: true, description: 'RPC URL' })
        .option({ name: 'to', type: 'string', required: true, description: 'Target address' })
        .option({ name: 'data', type: 'string', required: true, description: 'Calldata 0x...' })
        .option({ name: 'from', type: 'string', description: 'From address' })
        .option({ name: 'state-file', type: 'string', description: 'Path to stateOverrides JSON' })
        .option({ name: 'chain-id', type: 'number', description: 'Chain ID' })
        .option({ name: 'cache-path', type: 'string', description: 'Cache dir' })
        .option({ name: 'etherscan-key', type: 'string', description: 'Explorer key' })
        .option({
          name: 'verbosity',
          type: 'string',
          description: 'Lowest|Low|Normal|High|Highest',
        })
    })
    .action(async (args) => {
      const { tracer, client } = makeTracer(args)
      const overrides = loadOverrides(args['state-file'])
      // TODO: pass gas-profiler toggle if/when supported
      const [err, res] = await tracer.traceCall({
        to: args['to'] as `0x${string}`,
        data: args['data'] as `0x${string}`,
        account: (args['from'] ?? undefined) as `0x${string}` | undefined,
        chain: client.chain,
        tracer: 'callTracer',
        tracerConfig: { withLog: true },
        stateOverride: overrides as any,
      })
      if (err) {
        console.error(pc.red('✖ Trace failed:\n'), err)
        process.exit(1)
      }
      console.log(res)
    })
}
