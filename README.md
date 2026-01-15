# EVM Transaction Tracer

_This software is in Alpha and many features for the cli are still currently being worked on_

I dont maintain this anymore. i just use it locally when i need it. if you do want to use this. i made a massive breaking change to have the tracer extend the ciem public cliengt actions. so all of the docs below show the old and now incorrect usage., so if you do decide to install this you will have to figure out how it works by looking inside my playground or examples workspaces. i might get around someday to finishing the cli (lol to make it actually work) aswell as updating this to be a usable package. but then again this project was always meant for my own personal use to help me debug stuff in work

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

# Usage
## Transaction Trace

to use evm-tt in your backend application simply import the evm-tt viem `traceActions` extension and extend your client isnatnce by it.
```ts
import { traceActions } from '@evm-tt/tracer'

const client = createPublicClient({
    batch: {
      multicall: true,
    },
    transport: http(rpcUrl),
    chain: mainnet,
  }).extend(tracerActions)

```

the `tracerActions` allow you to access tracing capabilities directly from your normal client, so there is no ned for extra imports or any other type of boilerplate. just extend your client and your good to go. there are four `trace actions` you can avail of. `traceCall`, `traceTransactionHash`, and also the equivieltn gas porfilers  `traceGasCall`, `traceTGasransactionHash`, 

```ts
import {
  getUnlimitedBalanceAndApprovalStateOverrides,
} from '@evm-tt/tracer'

  // for tracing calldata with state overrides
const [error, trace] = await client.traceCall({
    account: SENDER,
    to: TO,
    data: '0x3593564....',
    stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(
      SENDER,
      TOKEN,
      TO,
    ),
    tracerOps: DefaultTracerOptions
})

console.log(trace.traceFormatted)

// For tracing transaction hashes
const [error, trace] = await client.traceTransactionHash({
    txHash:
      '0xf4a91c18dad36c9a0717da2375aef02b14bcd0e89dd5f1fc8f19d7952cdb5649',

    tracerOps: DefaultTracerOptions,
})

console.log(trace.traceFormatted)
```
Note that it is recommened that your prc provider must support the `debug_tracecall` and `debug_traceTransaction` JSON RPC method for the best developer experience.

The `traceCall`, `traceTransactionHash` call accepts an optional configration. to allow you to provide known abis, etherscan api key and for tracing with an anvil fork. (useful for public RPSs that dont have support for trace_call). outside of your normal ethereum tx arguments. you can pass in two new ones. they are `cache: Cache` and `env: Enviornemnt`, which live inside a single `tracerOps: {}` object

## Cache Option

| Option         | Type                                                    | Description                                                                                                                                                                     |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cachePath`    | `string` (directory path)                               | Directory where ABI signatures and decoded items are cached for faster subsequent decoding.                                                                                     |
| `etherscanApiKey` | `string`                                                | Etherscan api key for accessing async abi decoding while tracing..                                                                                         |
| `byAddress`    | `Record<string, { name?: string; abi?: Abi \| Abi[] }>` | Map contract addresses to a display name and ABI. When a mapped contract appears in a trace, its `name` is shown instead of the raw address and its `abi` is used for decoding. |
| `extraAbis`    | `Abi[]`                                                 | Additional ABIs not tied to a specific address or name but available to the decoder.                                                                                            |


## Etherscan API KEY
to access extra abis under the hood, evm-tt uses etherscans api. to use this you will need an API key. this is no issue as you can get them for free by simply signing into `https://etherscan.io` and navigating to your dashboard. it is highly recommnded that you use an etherscan abi key for the best results, otherwise you will need to rely on the `cacheOptions` ABI configuration to get the same level of readable results.

see the [Documentation](https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/docs/DOCUMENTATION.md) to learn more about what how each config option affetcs usage and results. Thern to visualise a trace simply evoke the method and wait for the trace to log in your terminal

```ts
const [error, trace] = await client.traceCall(
   {
      account: SENDER,
      blockNumber: 9451543n,
      to: TO,
      data: '0x83643.....',
      chain: client.chain,
      stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),
      tracerOps: {
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
          },
          extraAbis: [
            Permit2,
            UniSwapPool,
            erc20Abi,
          ],
          etherscanApiKey: 'MY_ETHERSCAN_KEY',
        },
      env: { kind: 'fork', blockNumber: 23212888 } // use this option if your rpc doesnt support debugTracecall
    },
  },
  )

// OR TRACE TX HASH

const [error, trace] = await client.traceTransactionHash(
    {
      txHash:
        '0xf4a91c18dad36c9a0717da2375aef02b14bcd0e89dd5f1fc8f19d7952cdb5649',
    },
  )
```

the `tracer.traceCall` and `tracer.traceTransactionHash` methods accept two arguments. the first is a simple `viem TransactionRequest` object, or if you tracing a txHash, you just pass the hash. the second object has options to let you configure thing sliek whether or not to show a gasProfile etx


| Option         | Type                                                    | Description                                                                                                                                                                     |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `env`    | `env: { kind: 'fork', blockNumber: number }`                 | Supported only by `traceCall`, spins up a forked envionrment and runs the simulation with the fork. this is needed when your prc provider does not support `debugTraceCall` |                                                                                         |

## Forking With Anvil

if your RPC Provider does not support the `debug_traceCall` method, make sure you pass in the env kind option as `fork`. this way an anvil forked instance is spawned from you rpc url and its used to do the traceCall simulation. this lets you still do traces with the likes of public rpcUrls which dont support `debugTraceCall` out of the box


### Result

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/tx-trace.png">


## Gas Profiler

you can also get a traces gas profile, which outputs the gas spent by each call made in a request. This method is very useful for seeing how much gas is being spent by different external contract calls. To evoke this method run

```ts
 const [error, trace] = await client.traceGasCall(
   {
      account: SENDER,
      blockNumber: 9451543n,
      to: TO,
      data: '0x83643.....',
      chain: client.chain,
      stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO), // state overrides
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

const [error, trace] = await client.traceGasCall({
  ...
  stateOverride: getUnlimitedBalanceAndApprovalStateOverrides(SENDER, TOKEN, TO),
})
```

## CLI Installation
or install the cli to access all the capabilities of `evm-tt` from you command line. To install the cli. run the command below and install globally on you machne

```bash
npm install -g @evm-tt/cli
```

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/cli.png">



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


