import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

export const getPublicClient = (rpcUrl: string) =>
  createPublicClient({
    batch: {
      multicall: true,
    },
    transport: http(rpcUrl),
    chain: mainnet,
  })
