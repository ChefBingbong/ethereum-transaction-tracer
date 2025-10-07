import type { TracerOps } from '@evm-tt/tracer'
import { createPublicClient, defineChain, erc20Abi, http } from 'viem'
import { mainnet } from 'viem/chains'
import { CFG } from './abis/CFG'
import { FiatTokenProxyAbi } from './abis/FiatTokenProxy'
import { FiatTokenProxy2 } from './abis/FiatTokenProxyV2'
import { Permit2 } from './abis/Permit2'
import { PoolManager } from './abis/PoolManager'
import { UniSwapPool } from './abis/UniswapPool'
import { UniversalRouter } from './abis/UniversalRouter'

export const hyperEvm = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
    public: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
})

export const getPublicClient = (rpcUrl: string) =>
  createPublicClient({
    batch: {
      multicall: true,
    },
    transport: http(rpcUrl),
    chain: mainnet,
  })

export const DefaultTracerOptions: TracerOps = {
  cache: {
    cachePath: `./tx-cache-dir`,
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
    etherscanApiKey: '8E6CI28EZUYCY1GG8CMZTPCCCNCVYCS8S2',
  },
  run: {
    env: { kind: 'rpc' },
    showProgressBar: false,
    streamLogs: false,
  },
}
