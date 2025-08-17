export const OBExecutorAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_persistentData',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'receive',
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'FEE_DENOM',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'algebraSwapCallback',
    inputs: [
      {
        name: 'amount0Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'amount1Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'distributeAndSwap',
    inputs: [
      {
        name: 'stream',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'tokenIn',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountTotal',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executePath',
    inputs: [
      {
        name: 'route',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'hyperswapV3SwapCallback',
    inputs: [
      {
        name: 'amount0Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'amount1Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'laminarV3SwapCallback',
    inputs: [
      {
        name: 'amount0Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'amount1Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'marginalV1SwapCallback',
    inputs: [
      {
        name: 'amount0Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'amount1Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'persistentData',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract OBExecutorPersistentData',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'processAggregator',
    inputs: [
      {
        name: 'outToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'stream',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'processMyERC20',
    inputs: [
      {
        name: 'stream',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountTotal',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'processNative',
    inputs: [
      {
        name: 'stream',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountTotal',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'processOnePool',
    inputs: [
      {
        name: 'stream',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swap',
    inputs: [
      {
        name: 'stream',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenIn',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapCallback',
    inputs: [
      {
        name: 'amount0Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'amount1Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'uniswapV3SwapCallback',
    inputs: [
      {
        name: 'amount0Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'amount1Delta',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    name: 'AddressEmptyCode',
    inputs: [
      {
        name: 'target',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'CallbackFromUnknownSource',
    inputs: [
      {
        name: 'actual',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'expected',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'FailedCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      {
        name: 'balance',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'needed',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'InvalidDeltaAmount',
    inputs: [
      {
        name: 'amountDelta',
        type: 'int256',
        internalType: 'int256',
      },
    ],
  },
  {
    type: 'error',
    name: 'InvalidNativeTransfer',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPoolReserves',
    inputs: [
      {
        name: 'amountZero',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOne',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeCastOverflowedIntToUint',
    inputs: [
      {
        name: 'value',
        type: 'int256',
        internalType: 'int256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SafeCastOverflowedUintToInt',
    inputs: [
      {
        name: 'value',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'UnknownAggregatorType',
    inputs: [
      {
        name: 'aggregatorType',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
  },
  {
    type: 'error',
    name: 'UnknownCommandCode',
    inputs: [
      {
        name: 'commandCode',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
  },
  {
    type: 'error',
    name: 'UnknownPoolType',
    inputs: [
      {
        name: 'poolType',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
  },
] as const
