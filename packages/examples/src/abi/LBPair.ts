export const LBPairAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'factory_',
        type: 'address',
        internalType: 'contract ILBFactory',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveForAll',
    inputs: [
      {
        name: 'spender',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
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
    name: 'balanceOfBatch',
    inputs: [
      {
        name: 'accounts',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'ids',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [
      {
        name: 'batchBalances',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'batchTransferFrom',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'ids',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'burn',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'ids',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'amountsToBurn',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'collectProtocolFees',
    inputs: [],
    outputs: [
      {
        name: 'collectedProtocolFees',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'flashLoan',
    inputs: [
      {
        name: 'receiver',
        type: 'address',
        internalType: 'contract ILBFlashLoanCallback',
      },
      {
        name: 'amounts',
        type: 'bytes32',
        internalType: 'bytes32',
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
    name: 'forceDecay',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getActiveId',
    inputs: [],
    outputs: [
      {
        name: 'activeId',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBin',
    inputs: [
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    outputs: [
      {
        name: 'binReserveX',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'binReserveY',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBinStep',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint16',
        internalType: 'uint16',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'getFactory',
    inputs: [],
    outputs: [
      {
        name: 'factory',
        type: 'address',
        internalType: 'contract ILBFactory',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getIdFromPrice',
    inputs: [
      {
        name: 'price',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'getLBHooksParameters',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getNextNonEmptyBin',
    inputs: [
      {
        name: 'swapForY',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    outputs: [
      {
        name: 'nextId',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getOracleParameters',
    inputs: [],
    outputs: [
      {
        name: 'sampleLifetime',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'size',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'activeSize',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'lastUpdated',
        type: 'uint40',
        internalType: 'uint40',
      },
      {
        name: 'firstTimestamp',
        type: 'uint40',
        internalType: 'uint40',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getOracleSampleAt',
    inputs: [
      {
        name: 'lookupTimestamp',
        type: 'uint40',
        internalType: 'uint40',
      },
    ],
    outputs: [
      {
        name: 'cumulativeId',
        type: 'uint64',
        internalType: 'uint64',
      },
      {
        name: 'cumulativeVolatility',
        type: 'uint64',
        internalType: 'uint64',
      },
      {
        name: 'cumulativeBinCrossed',
        type: 'uint64',
        internalType: 'uint64',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPriceFromId',
    inputs: [
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    outputs: [
      {
        name: 'price',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'getProtocolFees',
    inputs: [],
    outputs: [
      {
        name: 'protocolFeeX',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'protocolFeeY',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getReserves',
    inputs: [],
    outputs: [
      {
        name: 'reserveX',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'reserveY',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getStaticFeeParameters',
    inputs: [],
    outputs: [
      {
        name: 'baseFactor',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'filterPeriod',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'decayPeriod',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'reductionFactor',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'variableFeeControl',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'protocolShare',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'maxVolatilityAccumulator',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSwapIn',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'swapForY',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [
      {
        name: 'amountIn',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'amountOutLeft',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'fee',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSwapOut',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'swapForY',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [
      {
        name: 'amountInLeft',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'amountOut',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'fee',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTokenX',
    inputs: [],
    outputs: [
      {
        name: 'tokenX',
        type: 'address',
        internalType: 'contract IERC20',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'getTokenY',
    inputs: [],
    outputs: [
      {
        name: 'tokenY',
        type: 'address',
        internalType: 'contract IERC20',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'getVariableFeeParameters',
    inputs: [],
    outputs: [
      {
        name: 'volatilityAccumulator',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'volatilityReference',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'idReference',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'timeOfLastUpdate',
        type: 'uint40',
        internalType: 'uint40',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'implementation',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'increaseOracleLength',
    inputs: [
      {
        name: 'newLength',
        type: 'uint16',
        internalType: 'uint16',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'initialize',
    inputs: [
      {
        name: 'baseFactor',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'filterPeriod',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'decayPeriod',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'reductionFactor',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'variableFeeControl',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'protocolShare',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'maxVolatilityAccumulator',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'activeId',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'spender',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidityConfigs',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
      {
        name: 'refundTo',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'amountsReceived',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'amountsLeft',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'liquidityMinted',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setHooksParameters',
    inputs: [
      {
        name: 'hooksParameters',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'onHooksSetData',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setStaticFeeParameters',
    inputs: [
      {
        name: 'baseFactor',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'filterPeriod',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'decayPeriod',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'reductionFactor',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'variableFeeControl',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'protocolShare',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'maxVolatilityAccumulator',
        type: 'uint24',
        internalType: 'uint24',
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
        name: 'swapForY',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'amountsOut',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
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
    type: 'event',
    name: 'ApprovalForAll',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CollectedProtocolFees',
    inputs: [
      {
        name: 'feeRecipient',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'protocolFees',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CompositionFees',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'id',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
      {
        name: 'totalFees',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'protocolFees',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DepositedToBins',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'ids',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
      {
        name: 'amounts',
        type: 'bytes32[]',
        indexed: false,
        internalType: 'bytes32[]',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FlashLoan',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'receiver',
        type: 'address',
        indexed: true,
        internalType: 'contract ILBFlashLoanCallback',
      },
      {
        name: 'activeId',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
      {
        name: 'amounts',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'totalFees',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'protocolFees',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ForcedDecay',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'idReference',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
      {
        name: 'volatilityReference',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'HooksParametersSet',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'hooksParameters',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Initialized',
    inputs: [
      {
        name: 'version',
        type: 'uint64',
        indexed: false,
        internalType: 'uint64',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OracleLengthIncreased',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'oracleLength',
        type: 'uint16',
        indexed: false,
        internalType: 'uint16',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'StaticFeeParametersSet',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'baseFactor',
        type: 'uint16',
        indexed: false,
        internalType: 'uint16',
      },
      {
        name: 'filterPeriod',
        type: 'uint16',
        indexed: false,
        internalType: 'uint16',
      },
      {
        name: 'decayPeriod',
        type: 'uint16',
        indexed: false,
        internalType: 'uint16',
      },
      {
        name: 'reductionFactor',
        type: 'uint16',
        indexed: false,
        internalType: 'uint16',
      },
      {
        name: 'variableFeeControl',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
      {
        name: 'protocolShare',
        type: 'uint16',
        indexed: false,
        internalType: 'uint16',
      },
      {
        name: 'maxVolatilityAccumulator',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Swap',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'id',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
      {
        name: 'amountsIn',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'amountsOut',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'volatilityAccumulator',
        type: 'uint24',
        indexed: false,
        internalType: 'uint24',
      },
      {
        name: 'totalFees',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'protocolFees',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'TransferBatch',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'from',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'ids',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
      {
        name: 'amounts',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'WithdrawnFromBins',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'ids',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
      {
        name: 'amounts',
        type: 'bytes32[]',
        indexed: false,
        internalType: 'bytes32[]',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'BinHelper__CompositionFactorFlawed',
    inputs: [
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
  },
  {
    type: 'error',
    name: 'BinHelper__LiquidityOverflow',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BinHelper__MaxLiquidityPerBinExceeded',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FeeHelper__FeeTooLarge',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Hooks__CallFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidInitialization',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__AddressZero',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__EmptyMarketConfigs',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__FlashLoanCallbackFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__FlashLoanInsufficientAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__InsufficientAmountIn',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__InsufficientAmountOut',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__InvalidHooks',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__InvalidInput',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__InvalidStaticFeeParameters',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__MaxTotalFeeExceeded',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__OnlyFactory',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__OnlyProtocolFeeRecipient',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__OutOfLiquidity',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__TokenNotSupported',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__ZeroAmount',
    inputs: [
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBPair__ZeroAmountsOut',
    inputs: [
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBPair__ZeroBorrowAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBPair__ZeroShares',
    inputs: [
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBToken__AddressThisOrZero',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBToken__BurnExceedsBalance',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBToken__InvalidLength',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBToken__SelfApproval',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBToken__SpenderNotApproved',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'spender',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBToken__TransferExceedsBalance',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LiquidityConfigurations__InvalidConfig',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotInitializing',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OracleHelper__InvalidOracleId',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OracleHelper__LookUpTimestampTooOld',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OracleHelper__NewLengthTooSmall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PackedUint128Math__AddOverflow',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PackedUint128Math__MultiplierTooLarge',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PackedUint128Math__SubUnderflow',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PairParametersHelper__InvalidParameter',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeCast__Exceeds128Bits',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeCast__Exceeds24Bits',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeCast__Exceeds40Bits',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TokenHelper__TransferFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Uint128x128Math__LogUnderflow',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Uint128x128Math__PowUnderflow',
    inputs: [
      {
        name: 'x',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'y',
        type: 'int256',
        internalType: 'int256',
      },
    ],
  },
  {
    type: 'error',
    name: 'Uint256x256Math__MulDivOverflow',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Uint256x256Math__MulShiftOverflow',
    inputs: [],
  },
] as const
