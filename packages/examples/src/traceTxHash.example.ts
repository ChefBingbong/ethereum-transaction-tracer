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
  txHash: '0xb69ca89fe47b48e360dce1d0c5acbebcdab8dc5c844488197a48723ccdcc7674',
  tracerConfig: { withLog: true },
})

console.log(trace)
