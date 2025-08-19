import { TransactionTracer } from '@evm-transaction-trace/tracer'
import { type Address, erc20Abi, type PublicClient } from 'viem'
import { getUnlimitedBalanceAndApprovalStateOverrides } from '../../tracer/src/token-slot-override'
import { hyperBrickFactoryAbi } from './abi/HyperBrickFactory.abi'
import { HyperBrickPairABI } from './abi/HyperBrickPair.abi'
import { LBRouterAbi } from './abi/LBRouterabi'
import { OBExecutorAbi } from './abi/obExecutorAbi'
import { RouterAbi } from './abi/routerabi'
import { getPublicClient } from './client'
import { ETHERSCAN_API_KEY, RPC_URL } from './config'
import { ERC20A, EXECUTOR, LBRouter, ROUTER } from './constants'

const client = getPublicClient(RPC_URL) as PublicClient
export const TOKEN = '0x5555555555555555555555555555555555555555'
const SENDER: Address = '0xc91E7af2E874A2e04183908AdD8b5c3bDb515CFC'

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
  verbosity: 2,
})

await tracer.init()

const [_error, trace] = await tracer.traceCall({
  account: SENDER,
  //   blockTag: 'latest',
  to: ROUTER,
  data: '0xd46cadbc000000000000000000000000555555555555555555555555555555555555555500000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000b8ce59fc3717ada4c02eadf9682a9e934f625ebb00000000000000000000000000000000000000000000000000000000000010bb00000000000000000000000000000000000000000000000000000000000010ba000000000000000000000000c91e7af2e874a2e04183908add8b5c3bdb515cfc000000000000000000000000000000000000000000000000000000000000012000000000000000000000000007b93b6766a40df8c96440dc55708ca997229872000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000b9B8CE59FC3717ada4C02eaDF9682A9e934F625ebb00000000000000000000000000000000000000000000000000000000000000000010bb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001555555555555555555555555555555555555555501ffff01337b56d87A6185cD46AF3Ac2cDF03CBC37070C300107B93B6766A40Df8C96440DC55708ca99722987200000000000000',
  tracer: 'callTracer',
  chain: client.chain,
  tracerConfig: { withLog: true },
  stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(
    SENDER,
    TOKEN,
    ROUTER,
  ),
})

console.log(trace)
