import { LogVerbosity, TransactionTracer } from '@evm-tt/tracer'
import { erc20Abi } from 'viem'
import { CFG } from '../abis/CFG'
import { FiatTokenProxyAbi } from '../abis/FiatTokenProxy'
import { FiatTokenProxy2 } from '../abis/FiatTokenProxyV2'
import { Permit2 } from '../abis/Permit2'
import { PoolManager } from '../abis/PoolManager'
import { UniSwapPool } from '../abis/UniswapPool'
import { UniversalRouter } from '../abis/UniversalRouter'
import { getPublicClient } from './client'

// must use a berachain al url for this example
const client = getPublicClient('https://ethereum-mainnet.gateway.tatum.io')

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
  const [error, trace] = await tracer.traceTransactionHash({
    gasProfiler: true,
    txHash:
      '0xca7c76095ba8babf071ea1795f99c3306513d3dfc2aad24dab890f84d0b9e184',
  })

  if (error) {
    console.log(error)
    process.exit(1)
  }
  console.log(trace)
  process.exit(0)
}
