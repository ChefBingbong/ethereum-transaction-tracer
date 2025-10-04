import { getUnlimitedBalanceAndApprovalStateOverrides } from '@evm-tt/tracer'
import { logger } from '@evm-tt/utils'
import {
  getConfigDir,
  loadEnv,
  resolveAndParseCliParams,
  traceRequestArgs,
} from '../configCli'
import createTask from '../program'
import { makeTracer } from '../utils/tracer'

createTask('traceRequest')
  .description(
    'Simulate and trace a transaction request via calldata (debug_traceCall)',
  )
  .requiredOption('--to <0x..>', 'Tareget Recipient or Contract')
  .requiredOption('--data <0x..>', 'encoded transaction calldata')
  .requiredOption('--value <0n>', 'native value for the transaction')
  .option('--from <0x..>', 'initiator of the transaction')
  .option('--token <0x..>', 'approval token of the transaction')
  .option('--gas', 'flag to run gas profiler')
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
    const parsedArgs = resolveAndParseCliParams(traceRequestArgs, env, opts)

    if (parsedArgs.error) {
      logger.error(`${parsedArgs.error.issues[0].message}`)
      process.exit(1)
    }
    const tracerArgs = parsedArgs.data
    const client = makeTracer(parsedArgs.data)

    const { maxFeePerGas, maxPriorityFeePerGas } =
      await client.estimateFeesPerGas()
    const { baseFeePerGas } = await client.getBlock()

    const [traceError] = await client.traceCall({
      account: tracerArgs.from,
      to: tracerArgs.to,
      data: tracerArgs.data,
      value: BigInt(tracerArgs.value),
      chain: client.chain,
      // showProgressBar: true,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: baseFeePerGas ?? undefined,
      stateOverride:
        tracerArgs.from && tracerArgs.token
          ? getUnlimitedBalanceAndApprovalStateOverrides(
              tracerArgs.from,
              tracerArgs.token,
              tracerArgs.to,
            )
          : undefined,
      tracerOps: {
        cache: {
          cachePath: getConfigDir(),
          // etherscanApiKey: '8E6CI28EZUYCY1GG8CMZTPCCCNCVYCS8S2',
        },
        run: {
          // env: { kind: 'fork', blockNumber: 23212888 },
          showProgressBar: false,
          streamLogs: false,
        },
      },
    })

    if (traceError) {
      logger.error(`Failed when tracing tx ${traceError.message}`)
      process.exit(1)
    }
    process.exit(1)
  })
