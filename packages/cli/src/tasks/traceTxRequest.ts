import { logger } from '@evm-tt/utils'
import { loadEnv } from '../configCli/env'
import { resolveAndParseCliParams, traceTxArgs } from '../configCli/schema'
import createTask from '../program'
import { makeTracer } from '../utils/tracer'

createTask('traceRequest')
  .description('Simulate and trace a transaction request via calldata (debug_traceCall)')
  .requiredOption('--to <0x..>', 'Tareget Recipient or Contract')
  .requiredOption('--data <0x..>', 'encoded transaction calldata')
  .requiredOption('--value <0n>', 'native value for the transaction')
  .option('--from <0x..>', 'initiator of the transaction')
  .option('--rpc <url>', 'RPC URL (overrides env)')
  .option('--chain-id <id>', 'Chain ID to resolve RPC_URL_<id> from env', Number.parseInt)
  .option('--cache-path <path>', 'Cache directory')
  .option('--etherscan-key <key>', 'Etherscan API key (overrides env)')
  .option('--verbosity <level>', 'Lowest|Low|Normal|High|Highest', 'Normal')
  .action(async (opts) => {
    const env = await loadEnv()
    const parsedArgs = resolveAndParseCliParams(traceTxArgs, env, opts)

    if (parsedArgs.error) {
      logger.error(`${parsedArgs.error.issues[0].message}`)
      process.exit(1)
    }

    const tracer = makeTracer(parsedArgs.data)
    const [traceError] = await tracer.traceTransactionHash({
      txHash: parsedArgs.data.hash,
    })

    if (traceError) {
      logger.error(`Failed when tracing tx ${traceError.message}`)
      process.exit(1)
    }
  })
