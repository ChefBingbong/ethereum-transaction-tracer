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

const [_error, trace] = await tracer.traceTransactionHash({
  tracer: 'callTracer',
  txHash: '0xca7c76095ba8babf071ea1795f99c3306513d3dfc2aad24dab890f84d0b9e184',
  tracerConfig: { withLog: true },
})

console.log(trace)

// const [_e, _rr] = await safeTry(() =>
//   Promise.resolve(
//     decodeFunctionResult({
//       abi: erc20Abi as Abi,
//       functionName: 'fnItem.name',
//       data: '0x223',
//     }),
//   ),
// )

// console.log(_e)
