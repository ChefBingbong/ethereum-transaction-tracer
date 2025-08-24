# evm-tt

evm-tt `(evm-transaction-trace)` brings tenderly and foundry like stack traces to javascript enviornments. Unlike tenderly, evm-tt supports any evm chain, supporting traces for both verified onchain transactions and calldat simulations. There is a gas profiler built in, aswell as async caching and abi lookups for indexing contract names and methods. evm-tt is an extremely useful tool for backend web3 javascript developers and makes up where tenderly and foundry fall short.

installation
to install this library simly run
```bash
bun add evm-tt

pnpm add evm-tt

yarn add evm-tt
```

## Usage

to use evm-tt in your backend application simply import the main `TransactionTracer` entity and create and instance for your needs. Note that your prc provider must support the `debug_tracecall` JSON RPC method.
```ts
const client = getPublicClient(RPC_URL)

const tracer = new TransactionTracer(client, {
  cachePath: `./tx-cache-dir`,
  cacheOptions: {
    etherscanApiKey: ETHERSCAN_API_KEY, // optional for async abi lookups
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

```

see the [Documentation](/.github/docs/DOCUMENTATION.md) to learn more about what how each config option affetcs usage and results. Thern to visualise a trace simply evoke the method and wait for the trace to log in your terminal

```ts
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

## Result

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/tx-trace.png">


## Contributing

If you're interested in contributing, please read the [contributing docs](/.github/docs/CONTRIBUTING.md) **before submitting a pull request**.

## Authors

- [@ChefBingbong](https://github.com/ChefBingbong)

## License

[ISC](/LICENSE) License


<br />
<br />


