# EVM Transaction Tracer

_This software is in Alpha and many features for the cli are still currently being worked on_

evm-tt `(evm-transaction-trace)` brings tenderly and foundry like stack traces to javascript enviornments. Unlike tenderly, evm-tt supports any evm chain, supporting traces for both verified onchain transactions and calldat simulations. There is a gas profiler built in, aswell as async caching and abi lookups for indexing contract names and methods. evm-tt is an extremely useful tool for backend web3 javascript developers and makes up where tenderly and foundry fall short.

installation
to install this library simly run

## bun
```bash
bun add @evm-tt/tracer
```

## yarn
```bash
yarn add @evm-tt/tracer
```

## pnpm
```bash
pnpm add @evm-tt/tracer
```

## CLI Installation
or install the cli to access all the capabilities of `evm-tt` from you command line. To install the cli. run the command below and install globally on you machne

```bash
npm install -g @evm-tt/cli
```

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/cli.png">


# Usage
## Transaction Trace

to use evm-tt in your backend application simply import the main `TransactionTracer` entity and create and instance for your needs. Note that it is recommened that your prc provider must support the `debug_tracecall` and `debug_traceTransaction` JSON RPC method for the best developer experience.
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
    extraAbis: [
      // useful for abis that have no fixed address
    ],
  },
  verbosity: LogVerbosity.Highest,
})

```

the `TransactionTracer` class accepts a few optional configration.


| Option         | Type                                                    | Description                                                                                                                                                                     |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cachePath`    | `string` (directory path)                               | Directory where ABI signatures and decoded items are cached for faster subsequent decoding.                                                                                     |
| `cacheOptions` | `object`                                                | Decoder helpers made of known ABIs that will be used when decoding calls within traces.                                                                                         |
| `byAddress`    | `Record<string, { name?: string; abi?: Abi \| Abi[] }>` | Map contract addresses to a display name and ABI. When a mapped contract appears in a trace, its `name` is shown instead of the raw address and its `abi` is used for decoding. |
| `extraAbis`    | `Abi[]`                                                 | Additional ABIs not tied to a specific address or name but available to the decoder.                                                                                            |


## Etherscan API KEY
to access extra abis under the hood, evm-tt uses etherscans api. to use this you will need an API key. this is no issue as you can get them for free by simply signing into `https://etherscan.io` and navigating to your dashboard. it is highly recommnded that you use an etherscan abi key for the best results, otherwise you will need to rely on the `cacheOptions` ABI configuration to get the same level of readable results.

see the [Documentation](https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/docs/DOCUMENTATION.md) to learn more about what how each config option affetcs usage and results. Thern to visualise a trace simply evoke the method and wait for the trace to log in your terminal

```ts
const [error, trace] = await tracer.traceCall(
   {
      account: SENDER,
      blockNumber: 9451543n,
      to: TO,
      data: '0x83643.....',
      chain: client.chain,
      stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),
  },
  {
      env: { kind: 'fork', blockNumber: 23212888 }, // use this option if your rpc doesnt support debugTracecall
      gasProfiler: false,
      showProgressBar: false,
      streamLogs: true,
 },
  )

// OR TRACE TX HASH

const [error, trace] = await tracer.traceTransactionHash(
    {
      txHash:
        '0xf4a91c18dad36c9a0717da2375aef02b14bcd0e89dd5f1fc8f19d7952cdb5649',
    },
    {
      gasProfiler: false,
      showProgressBar: false,
      streamLogs: true,
    },
  )
```

the `tracer.traceCall` and `tracer.traceTransactionHash` methods accept two arguments. the first is a simple `viem TransactionRequest` object, or if you tracing a txHash, you just pass the hash. the second object has options to let you configure thing sliek whether or not to show a gasProfile etx


| Option         | Type                                                    | Description                                                                                                                                                                     |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gasProfiler`    | `boolean`                                             | Whether or not to show the full trace or the gasPorfiler of the trace and the gas cost of each inner call                                                                                   |
| `showProgressbar` | `voolean`                                                |Whether or not to show a progress bar of your traces progress                                                                                      |
| `env`    | `env: { kind: 'fork', blockNumber: number }`                 | Supported only by `traceCall`, spins up a forked envionrment and runs the simulation with the fork. this is needed when your prc provider does not support `debugTraceCall` |                                                                                         |

## Forking With Anvil

if your RPC Provider does not support the `debug_traceCall` method, make sure you pass in the env kind option as `fork`. this way an anvil forked instance is spawned from you rpc url and its used to do the traceCall simulation. this lets you still do traces with the likes of public rpcUrls which dont support `debugTraceCall` out of the box


### Result

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/tx-trace.png">


## Gas Profiler

you can also get a traces gas profile, which outputs the gas spent by each call made in a request. This method is very useful for seeing how much gas is being spent by different external contract calls. To evoke this method run

```ts
 const [error, trace] = await tracer.traceCall(
   {
      account: SENDER,
      blockNumber: 9451543n,
      to: TO,
      data: '0x83643.....',
      chain: client.chain,
      stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),
  },
  {
      gasProfiler: true, // set this option to true
 },
  )
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

## Try It Out

there is a live [code sandbox here](https://codesandbox.io/p/devbox/fervent-fire-j2r593) open this up and `run bun run trace:tx` from the terminal. Alternatively, you can also check out into the `examples/` workspace in this monorepo. We have examples for `pnpm` and `bun` runtimes. Simpley `cd` into which ever example you desrire. there are two projects for each runTime. `/traceTxRequest` and `/TraceTxHash`. to start, `cd` into `/tracetXhash` and run `pnpm i` or `bun i` depending on which and to test out the examples run `bun run trace:tx` or `pnpm run trace:tx`. To run the `trace:request` script properly you will need an alchemy RPC URL.


## Contributing

If you're interested in contributing, please read the [contributing docs](https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/docs/CONTRIBUTING.md) **before submitting a pull request**.

## Authors

- [@ChefBingbong](https://github.com/ChefBingbong)

## License

[ISC](/LICENSE) License


<br />
<br />


