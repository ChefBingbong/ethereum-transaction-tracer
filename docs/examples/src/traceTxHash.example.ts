import { LogVerbosity, TransactionTracer } from '@evm-transaction-trace/tracer'
import { erc20Abi, type PublicClient } from 'viem'
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
      [ROUTER]: RouterAbi,
      [LBRouter]: LBRouterAbi,
      [EXECUTOR]: OBExecutorAbi,
      [ERC20A]: erc20Abi,
    },
    // extraAbis: [
    //   RouterAbi,
    //   erc20Abi,
    //   OBExecutorAbi,
    //   LBRouterAbi,
    //   HyperBrickPairABI,
    //   hyperBrickFactoryAbi,
    // ],
  },
  verbosity: LogVerbosity.Highest,
})

await tracer.init()

const [_error, trace] = await tracer.traceTransactionHash({
  tracer: 'callTracer',
  txHash: '0xca7c76095ba8babf071ea1795f99c3306513d3dfc2aad24dab890f84d0b9e184',
  tracerConfig: { withLog: true },
})

console.log(trace)
