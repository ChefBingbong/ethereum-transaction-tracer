import { createPublicClient, http } from 'viem'
import { berachain } from 'viem/chains'

export const getPublicClient = (rpcUrl: string) =>
  createPublicClient({
    batch: {
      multicall: true,
    },
    transport: http(rpcUrl),
    chain: berachain,
  })
