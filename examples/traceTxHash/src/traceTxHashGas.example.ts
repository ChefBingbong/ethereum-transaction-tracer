import { LogVerbosity, TransactionTracer } from '@evm-tt/tracer'
import { erc20Abi, type PublicClient } from 'viem'
import { getPublicClient } from './client'
import { ETHERSCAN_API_KEY, RPC_URL } from './config'
import { USDT0 } from './constants'

// must use a berachain al url for this example
const client = getPublicClient(RPC_URL) as PublicClient

const tracer = new TransactionTracer(client, {
  cachePath: `./tx-cache-dir`,
  cacheOptions: {
    etherscanApiKey: ETHERSCAN_API_KEY, // must have a etherscan api key
    byAddress: {
      [USDT0]: {
        name: 'USDT',
        abi: erc20Abi,
      },
    },
    contractNames: {
      [USDT0]: 'USDT',
    },
    extraAbis: [erc20Abi],
  },
  verbosity: LogVerbosity.Highest,
})

if (import.meta.main) {
  const [error, trace] = await tracer.traceGasFromTransactionHash({
    tracer: 'callTracer',
    txHash: '0xca7c76095ba8babf071ea1795f99c3306513d3dfc2aad24dab890f84d0b9e184',
    tracerConfig: { withLog: true },
  })

  if (error) {
    console.log(error)
    process.exit(1)
  }
  console.log(trace)
  process.exit(0)
}
