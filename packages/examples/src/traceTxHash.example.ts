import { TransactionTracer } from '@evm-transaction-trace/tracer'
import { erc20Abi, type PublicClient } from 'viem'
import { hyperBrickFactoryAbi } from './abi/HyperBrickFactory.abi'
import { HyperBrickPairABI } from './abi/HyperBrickPair.abi'
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
    extraAbis: [
      RouterAbi,
      erc20Abi,
      OBExecutorAbi,
      LBRouterAbi,
      HyperBrickPairABI,
      hyperBrickFactoryAbi,
    ],
  },
})

await tracer.init()

const trace = await tracer.traceTransactionHash({
  tracer: 'callTracer',
  txHash: '0x28b9f313d6beb43e0c71f23206b3d75db3255f772fefdc995fe45ff7cf0ca009',
  tracerConfig: { withLog: true },
})

console.log(trace)
