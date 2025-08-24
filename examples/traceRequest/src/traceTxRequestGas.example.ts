import {
  getUnlimitedBalanceAndApprovalStateOverrides,
  LogVerbosity,
  TransactionTracer,
} from '@evm-tt/tracer'
import { erc20Abi, type PublicClient } from 'viem'
import { CFG } from '../abis/CFG'
import { FiatTokenProxyAbi } from '../abis/FiatTokenProxy'
import { FiatTokenProxy2 } from '../abis/FiatTokenProxyV2'
import { Permit2 } from '../abis/Permit2'
import { PoolManager } from '../abis/PoolManager'
import { UniSwapPool } from '../abis/UniswapPool'
import { UniversalRouter } from '../abis/UniversalRouter'
import { getPublicClient } from './client'
import { RPC_URL } from './config'

const SENDER = '0xda8A8833E938192781AdE161d4b46c4973A40402'
const TO = '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af'
const TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

// must use a berachain al url for this example
const client = getPublicClient(RPC_URL) as PublicClient

const tracer = new TransactionTracer(client, {
  cachePath: `./tx-cache-dir`,
  cacheOptions: {
    // provinding etherscan api key, lets the package query all the contract names and methods

    // etherscanApiKey: ETHERSCAN_API_KEY,

    // if no api key is provided, manualy abi config is neeeded to resolve contract abi info
    byAddress: {
      ['0xcccccccccc33d538dbc2ee4feab0a7a1ff4e8a94']: {
        name: 'CFG',
        abi: erc20Abi,
      },
      ['0xdac17f958d2ee523a2206206994597c13d831ec7']: {
        name: 'USDT',
        abi: erc20Abi,
      },
      ['0x000000000022d473030f116ddee9f6b43ac78ba3']: {
        name: 'Permit2',
        abi: Permit2,
      },
      ['0x3416cf6c708da44db2624d63ea0aaef7113527c6']: {
        name: 'UniswapV3Pool',
        abi: UniSwapPool,
      },
      ['0x66a9893cc07d91d95644aedd05d03f95e1dba8af']: {
        name: 'UniversalRouter',
        abi: UniversalRouter,
      },
      ['0x000000000004444c5dc75cb358380d2e3de08a90']: {
        name: 'PoolManager',
        abi: PoolManager,
      },
      ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']: {
        name: 'FiatTokenProxy',
        abi: FiatTokenProxyAbi,
      },
      ['0x43506849d7c04f9138d1a2050bbf3a0c054402dd']: {
        name: 'FiatTokenV2_2',
        abi: FiatTokenProxy2,
      },
    },
    extraAbis: [
      CFG,
      FiatTokenProxyAbi,
      FiatTokenProxy2,
      Permit2,
      PoolManager,
      UniSwapPool,
      UniversalRouter,
      erc20Abi,
    ],
  },
  verbosity: LogVerbosity.Highest,
})

if (import.meta.main) {
  const [error, trace] = await tracer.traceCall({
    account: SENDER,
    blockNumber: 9451543n,
    to: TO,
    data: '0xd46cadbc000000000000000000000000fcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce0000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000069696969696969696969696969696969696969690000000000000000000000000000000000000000000000000ce398a6ded21fb70000000000000000000000000000000000000000000000000cc299af71129528000000000000000000000000e1c73b54dde8df5eb6472160f3648305be0a282600000000000000000000000000000000000000000000000000000000000001200000000000000000000000008db25eb64830a30254a1c016e873df97bcee41380000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000017f69696969696969696969696969696969696969690100000000000000000000000000000000000000000000000000000ce398a6ded21fb70000000000000000000000000000000000000000000000000c86bb32a60333000000000000000000000000000000000000000000000000000c86cc1f64e2590001FCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce01ffff019D4085e8B950F62d594bbBCac2AA0d5a0dC0e0E0008DB25Eb64830a30254a1c016E873Df97BcEE413801118D2cEeE9785eaf70C15Cd74CD84c9f8c3EeC9a01ffff012608B7c8Eb17e22CB95b7cD6f872993cf33a4CA1018DB25Eb64830a30254a1c016E873Df97BcEE413801D2C41BF4033A83C0FC3A7F58a392Bf37d6dCDb5801ffff17e5CAB105E2dC57bf0c27670D1aED543Dd526B68b8DB25Eb64830a30254a1c016E873Df97BcEE41380001ac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b01ffff0112bf773F18cEC56F14e7cb91d82984eF5A3148EE008DB25Eb64830a30254a1c016E873Df97BcEE413800',
    tracer: 'callTracer',
    chain: client.chain,
    tracerConfig: { withLog: true },
    stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),
  })

  if (error) {
    console.log(error)
    process.exit(1)
  }
  console.log(trace)
  process.exit(0)
}
