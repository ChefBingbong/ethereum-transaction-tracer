import { logger } from '@evm-tt/utils'
import { loadEnv } from '../configCli/env'
import { resolveAndParseCliParams, traceTxArgs } from '../configCli/schema'
import createTask from '../program'
import { makeTracer } from '../utils/tracer'

createTask('traceTx')
  .description(
    'Trace a mined onchain transaction by hash (debug_traceTransaction)',
  )
  .requiredOption('--hash <0x..>', 'Transaction hash (0x + 32 bytes)')
  .option('--rpc <url>', 'RPC URL (overrides env)')
  .option(
    '--chain-id <id>',
    'Chain ID to resolve RPC_URL_<id> from env',
    Number.parseInt,
  )
  .option('--cache-path <path>', 'Cache directory')
  .option('--etherscan-key <key>', 'Etherscan API key (overrides env)')
  .option('--verbosity <level>', 'Lowest|Low|Normal|High|Highest', 'Highest')
  .action(async (opts) => {
    const env = loadEnv()
    const parsedArgs = resolveAndParseCliParams(traceTxArgs, env, opts)

    if (parsedArgs.error) {
      logger.error(`${parsedArgs.error.issues[0].message}`)
      process.exit(1)
    }

    const tracer = makeTracer(parsedArgs.data)
    const [traceError] = await tracer.traceTransactionHash({
      txHash: parsedArgs.data.hash,
      showProgressBar: true,
      streamLogs: true,
    })

    if (traceError) {
      logger.error(`Failed when tracing tx ${traceError.message}`)
      process.exit(1)
    }
  })
