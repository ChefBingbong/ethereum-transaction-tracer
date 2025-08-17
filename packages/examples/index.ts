import { TransactionTracer } from '@evm-transaction-trace/tracer'
import { erc20Abi } from 'viem'
import { hyperBrickFactoryAbi } from './abi/HyperBrickFactory.abi'
import { HyperBrickPairABI } from './abi/HyperBrickPair.abi'
import { LBRouterAbi } from './abi/LBRouterabi'
import { OBExecutorAbi } from './abi/obExecutorAbi'
import { RouterAbi } from './abi/routerabi'
import { getPublicClient } from './client'
import { ERC20A, EXECUTOR, LBRouter, ROUTER } from './constants'

const client = getPublicClient(
  'https://hyperliquid-mainnet.g.alchemy.com/v2/HsPFcKqzokVEpuguZuPGW',
)

const tracer = new TransactionTracer(client, {
  cachePath: `./tx-cache-dir`,
  cacheOptions: {
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

// const trace = await tracer.traceCall({
//   account: '0xc91E7af2E874A2e04183908AdD8b5c3bDb515CFC',
//   to: '0x5fbD1B5AA82d09359C05428647871fe9aDd3F411',
//   data: '0xd46cadbc000000000000000000000000ffaa4a3d97fe9107cef8a3f48c069f577ff76cc100000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000555555555555555555555555555555555555555500000000000000000000000000000000000000000000000000005a1c86eda57300000000000000000000000000000000000000000000000000005a057562a819000000000000000000000000c91e7af2e874a2e04183908add8b5c3bdb515cfc00000000000000000000000000000000000000000000000000000000000001200000000000000000000000005577d98ec04bcc73111c7b2f45c13ed70d14a505000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000cd555555555555555555555555555555555555555500000000000000000000000000000000000000000000000000000000005a1c86eda5730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001fFaa4a3D97fE9107Cef8a3F48c069F577Ff76cC101ffff1d5365b6ef09253c7abc0a9286ec578a9f4b413b7d015577D98EC04BCC73111c7B2f45C13Ed70d14a505555555555555555555555555555555555555555500000000000000000000000000000000000000', // calldata
//   blockTag: 'latest',
//   tracer: 'callTracer',
//   tracerConfig: { withLog: true },
//   chain: client.chain,
// })

const trace = await tracer.traceTransactionHash({
  txHash: '0x08f9a2e55d4eee726a5e7848ea034ccc4e7afee21bcb4b490951582193e15d2d',
  tracer: 'callTracer',
  tracerConfig: { withLog: true },
})

console.log(trace)
