# evm-transaction-trace

This package visualises the trace of EVM Based transactions in Javascript and Node based enviornments. Tools like Foundry and Tenderly are are great for doing this already, but they come with limits. This package. lets developers trace transactions on any chain aswell as simulations from transaction calldata. The integration of async abi lookups, allow this package to be highly tailored to the developers needs giving much more readab;le traces than is provided by foundry or tenderly.

installation
```bash
bun add evm-transaction-trace
```

Usage
```ts
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

await tracer.init()

const [error, trace] = await tracer.traceCall({
    account: SENDER,
    blockNumber: 9451543n,
    to: TO,
    data: '0x83643.....',
    tracer: 'callTracer',
    chain: client.chain,
    tracerConfig: { withLog: true },
})

```

trace output
<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/assets/transaction-trace.png">

