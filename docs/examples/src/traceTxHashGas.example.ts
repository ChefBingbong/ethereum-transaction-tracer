import { LogVerbosity, TransactionTracer } from '@evm-transaction-trace/tracer'
import { erc20Abi, type PublicClient } from 'viem'
import { LBPairAbi } from './abi/LBPair'
import { LBRouterAbi } from './abi/LBRouterabi'
import { OBExecutorAbi } from './abi/obExecutorAbi'
import { RouterAbi } from './abi/routerabi'
import { getPublicClient } from './client'
import { ETHERSCAN_API_KEY, RPC_URL } from './config'
import { ERC20A, EXECUTOR, LBRouter, ROUTER } from './constants'

const client = getPublicClient(RPC_URL) as PublicClient

const tracer = new TransactionTracer(client, {
  cachePath: `./tx-cache-dir`,
  cacheOptions: {
    etherscanApiKey: ETHERSCAN_API_KEY,
    byAddress: {
      [ROUTER]: {
        name: 'OBRouter',
        abi: RouterAbi,
      },
      [LBRouter]: {
        name: 'LBRouter',
        abi: LBRouterAbi,
      },
      [EXECUTOR]: {
        name: 'OBExecutor',
        abi: OBExecutorAbi,
      },
      [ERC20A]: {
        name: 'ERC20',
        abi: erc20Abi,
      },
    },
    contractNames: {
      [ROUTER]: 'OBRouter',
    },
    extraAbis: [RouterAbi, LBPairAbi],
  },
  verbosity: LogVerbosity.Medium,
})

await tracer.init()

await tracer.traceGasFromTransactionHash({
  tracer: 'callTracer',
  txHash: '0xcc49bddc49cbaea56d5cda1d94a88596c871165ab3cbcc425b8953ed4d6ae3bc',
  tracerConfig: { withLog: true },
})
