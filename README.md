# evm-tt

evm-tt `(evm-transaction-trace)` brings tenderly and foundry like stack traces to javascript enviornments. Unlike tenderly, evm-tt supports any evm chain, supporting traces for both verified onchain transactions and calldat simulations. There is a gas profiler built in, aswell as async caching and abi lookups for indexing contract names and methods. evm-tt is an extremely useful tool for backend web3 javascript developers and makes up where tenderly and foundry fall short.

installation
to install this library simly run
```bash
bun add evm-tt

pnpm add evm-tt

yarn add evm-tt
```

# Usage
## Transaction Trace

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

see the [Documentation]('https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/docs/DOCUMENTATION.md) to learn more about what how each config option affetcs usage and results. Thern to visualise a trace simply evoke the method and wait for the trace to log in your terminal

```ts
const [error, trace] = await tracer.traceCall({
    account: SENDER,
    blockNumber: 9451543n,
    to: TO,
    data: '0x83643.....',
    chain: client.chain,
    stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),

})

// OR TRACE TX HASH

const [error, trace] = await tracer.traceCall({
    txHash: '0xf4a91c18dad36c9a0717da2375aef02b14bcd0e89dd5f1fc8f19d7952cdb5649,
})
```

### Result

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/tx-trace.png">


## Gas Profiler

you can also get a traces gas profile, which outputs the gas spent by each call made in a request. This method is very useful for seeing how much gas is being spent by different external contract calls. To evoke this method run

```ts
  const [error, trace] = await tracer.traceGasCall({
    account: SENDER,
    blockNumber: 9451543n,
    to: TO,
    data: '0xd46cad.....',
    chain: client.chain,
    stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),
  })
})
```

### Result

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/gas-trace.png">

### State Overrides

when simulation transaction request traces from calldata, you can use the evm-tt `state overrides` helper, to override account balances and allowances, so that you can test transactions without having to have the required balance. this is very useful for tracing large transactions that would otherwise be difficult to test without the proper balances. to use state overrides, import it and pass it in for the `stateOverride` option.

```ts
import { getUnlimitedBalanceAndApprovalStateOverrides } from '@evm-tt/tracer'

const SENDER = '0xda8A8833E938192781AdE161d4b46c4973A40402' // Account to override balance for
const TO = '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af' // Account to grant allowance for (spender)
const TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7' // Token to grant the allowance and balance overrides for

const [error, trace] = await tracer.traceGasCall({
  ...
  stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),
})
```

## Contributing

If you're interested in contributing, please read the [contributing docs]('https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/docs/CONTRIBUTING.md) **before submitting a pull request**.

## Authors

- [@ChefBingbong](https://github.com/ChefBingbong)

## License

[ISC](/LICENSE) License


<br />
<br />


