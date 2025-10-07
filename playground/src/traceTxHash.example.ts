import { traceActions } from '@evm-tt/tracer'
import { DefaultTracerOptions, getPublicClient } from './client'

// must use a berachain al url for this example
const client = getPublicClient(
  'https://ethereum-mainnet.gateway.tatum.io',
).extend(traceActions)

async function main() {
  const [error, trace] = await client.traceTransactionHash({
    txHash:
      '0xf4a91c18dad36c9a0717da2375aef02b14bcd0e89dd5f1fc8f19d7952cdb5649',

    tracerOps: DefaultTracerOptions,
  })

  if (error) {
    console.log(error)
    process.exit(1)
  }
  console.log(trace.traceFormatted)
  process.exit(0)
}
main()
