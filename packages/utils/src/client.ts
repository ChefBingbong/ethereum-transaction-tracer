import { createPublicClient, http, type PublicClient } from 'viem'

export const getPublicClient = (rpcUrl: string): PublicClient =>
  createPublicClient({
    batch: {
      multicall: true,
    },
    transport: http(rpcUrl),
  })
