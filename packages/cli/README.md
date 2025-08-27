# EVM Transaction Tracer

evm-tt `(evm-transaction-trace)` brings tenderly and foundry like stack traces to javascript enviornments. Unlike tenderly, evm-tt supports any evm chain, supporting traces for both verified onchain transactions and calldat simulations. There is a gas profiler built in, aswell as async caching and abi lookups for indexing contract names and methods. evm-tt is an extremely useful tool for backend web3 javascript developers and makes up where tenderly and foundry fall short.

installation
to install this library simly run

## CLI Installation
or install the cli to access all the capabilities of `evm-tt` from you command line. To install the cli. run the command below and install globally on you machne

```bash
npm install -g @evm-tt/cli
```

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/cli.png">


# Usage
## Transaction Trace

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/tx-trace.png">


## Gas Profiler

<img width="1092" alt="Console testing" src="https://github.com/ChefBingbong/ethereum-transaction-tracer/blob/main/assets/gas-trace.png">

## Try It Out

there is a live [code sandbox here](https://codesandbox.io/p/devbox/fervent-fire-j2r593) open this up and `run bun run trace:tx` from the terminal. Alternatively, you can also check out into the `examples/` workspace in this monorepo. We have examples for `pnpm` and `bun` runtimes. Simpley `cd` into which ever example you desrire. there are two projects for each runTime. `/traceTxRequest` and `/TraceTxHash`. to start, `cd` into `/tracetXhash` and run `pnpm i` or `bun i` depending on which and to test out the examples run `bun run trace:tx` or `pnpm run trace:tx`. To run the `trace:request` script properly you will need an alchemy RPC URL.

