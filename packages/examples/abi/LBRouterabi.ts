export const LBRouterAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'factory2_2',
        type: 'address',
        internalType: 'contract ILBFactory',
      },
      {
        name: 'factoryV1',
        type: 'address',
        internalType: 'contract IJoeFactory',
      },
      {
        name: 'legacyFactory',
        type: 'address',
        internalType: 'contract ILBLegacyFactory',
      },
      {
        name: 'legacyRouter',
        type: 'address',
        internalType: 'contract ILBLegacyRouter',
      },
      {
        name: 'factory2_1',
        type: 'address',
        internalType: 'contract ILBFactory',
      },
      {
        name: 'wnative',
        type: 'address',
        internalType: 'contract IWNATIVE',
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
    name: 'addLiquidity',
    inputs: [
      {
        name: 'liquidityParameters',
        type: 'tuple',
        internalType: 'struct ILBRouter.LiquidityParameters',
        components: [
          {
            name: 'tokenX',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'tokenY',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'binStep',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountX',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountY',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountXMin',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountYMin',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'activeIdDesired',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'idSlippage',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deltaIds',
            type: 'int256[]',
            internalType: 'int256[]',
          },
          {
            name: 'distributionX',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'distributionY',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'to',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'refundTo',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'amountXAdded',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountYAdded',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountXLeft',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountYLeft',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'depositIds',
        type: 'uint256[]',
        internalType: 'uint256[]',
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
    name: 'addLiquidityNATIVE',
    inputs: [
      {
        name: 'liquidityParameters',
        type: 'tuple',
        internalType: 'struct ILBRouter.LiquidityParameters',
        components: [
          {
            name: 'tokenX',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'tokenY',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'binStep',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountX',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountY',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountXMin',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountYMin',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'activeIdDesired',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'idSlippage',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deltaIds',
            type: 'int256[]',
            internalType: 'int256[]',
          },
          {
            name: 'distributionX',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'distributionY',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'to',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'refundTo',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'amountXAdded',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountYAdded',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountXLeft',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountYLeft',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'depositIds',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'liquidityMinted',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createLBPair',
    inputs: [
      {
        name: 'tokenX',
        type: 'address',
        internalType: 'contract IERC20',
      },
      {
        name: 'tokenY',
        type: 'address',
        internalType: 'contract IERC20',
      },
      {
        name: 'activeId',
        type: 'uint24',
        internalType: 'uint24',
      },
      {
        name: 'binStep',
        type: 'uint16',
        internalType: 'uint16',
      },
    ],
    outputs: [
      {
        name: 'pair',
        type: 'address',
        internalType: 'contract ILBPair',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getFactory',
    inputs: [],
    outputs: [
      {
        name: 'lbFactory',
        type: 'address',
        internalType: 'contract ILBFactory',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getFactoryV2_1',
    inputs: [],
    outputs: [
      {
        name: 'lbFactory',
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
        name: 'pair',
        type: 'address',
        internalType: 'contract ILBPair',
      },
      {
        name: 'price',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint24',
        internalType: 'uint24',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLegacyFactory',
    inputs: [],
    outputs: [
      {
        name: 'legacyLBfactory',
        type: 'address',
        internalType: 'contract ILBLegacyFactory',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLegacyRouter',
    inputs: [],
    outputs: [
      {
        name: 'legacyRouter',
        type: 'address',
        internalType: 'contract ILBLegacyRouter',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPriceFromId',
    inputs: [
      {
        name: 'pair',
        type: 'address',
        internalType: 'contract ILBPair',
      },
      {
        name: 'id',
        type: 'uint24',
        internalType: 'uint24',
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
    name: 'getSwapIn',
    inputs: [
      {
        name: 'pair',
        type: 'address',
        internalType: 'contract ILBPair',
      },
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
        name: 'pair',
        type: 'address',
        internalType: 'contract ILBPair',
      },
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
    name: 'getV1Factory',
    inputs: [],
    outputs: [
      {
        name: 'factoryV1',
        type: 'address',
        internalType: 'contract IJoeFactory',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getWNATIVE',
    inputs: [],
    outputs: [
      {
        name: 'wnative',
        type: 'address',
        internalType: 'contract IWNATIVE',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'removeLiquidity',
    inputs: [
      {
        name: 'tokenX',
        type: 'address',
        internalType: 'contract IERC20',
      },
      {
        name: 'tokenY',
        type: 'address',
        internalType: 'contract IERC20',
      },
      {
        name: 'binStep',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'amountXMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountYMin',
        type: 'uint256',
        internalType: 'uint256',
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
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountX',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountY',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeLiquidityNATIVE',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract IERC20',
      },
      {
        name: 'binStep',
        type: 'uint16',
        internalType: 'uint16',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountNATIVEMin',
        type: 'uint256',
        internalType: 'uint256',
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
      {
        name: 'to',
        type: 'address',
        internalType: 'address payable',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountToken',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountNATIVE',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapExactNATIVEForTokens',
    inputs: [
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'swapExactNATIVEForTokensSupportingFeeOnTransferTokens',
    inputs: [
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForNATIVE',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMinNATIVE',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address payable',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForNATIVESupportingFeeOnTransferTokens',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMinNATIVE',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address payable',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForTokens',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapNATIVEForExactTokens',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountsIn',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'swapTokensForExactNATIVE',
    inputs: [
      {
        name: 'amountNATIVEOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountInMax',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address payable',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountsIn',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapTokensForExactTokens',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountInMax',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'tuple',
        internalType: 'struct ILBRouter.Path',
        components: [
          {
            name: 'pairBinSteps',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
          {
            name: 'versions',
            type: 'uint8[]',
            internalType: 'enum ILBRouter.Version[]',
          },
          {
            name: 'tokenPath',
            type: 'address[]',
            internalType: 'contract IERC20[]',
          },
        ],
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountsIn',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sweep',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract IERC20',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sweepLBToken',
    inputs: [
      {
        name: 'lbToken',
        type: 'address',
        internalType: 'contract ILBToken',
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
    type: 'error',
    name: 'JoeLibrary__InsufficientAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'JoeLibrary__InsufficientLiquidity',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBRouter__AmountSlippageBPTooBig',
    inputs: [
      {
        name: 'amountSlippage',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__AmountSlippageCaught',
    inputs: [
      {
        name: 'amountXMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountX',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountYMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountY',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__BinReserveOverflows',
    inputs: [
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__BrokenSwapSafetyCheck',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBRouter__DeadlineExceeded',
    inputs: [
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'currentTimestamp',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__FailedToSendNATIVE',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
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
    name: 'LBRouter__IdDesiredOverflows',
    inputs: [
      {
        name: 'idDesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'idSlippage',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__IdOverflows',
    inputs: [
      {
        name: 'id',
        type: 'int256',
        internalType: 'int256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__IdSlippageCaught',
    inputs: [
      {
        name: 'activeIdDesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'idSlippage',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'activeId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__InsufficientAmountOut',
    inputs: [
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__InvalidTokenPath',
    inputs: [
      {
        name: 'wrongToken',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__InvalidVersion',
    inputs: [
      {
        name: 'version',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__LengthsMismatch',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBRouter__MaxAmountInExceeded',
    inputs: [
      {
        name: 'amountInMax',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__NotFactoryOwner',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBRouter__PairNotCreated',
    inputs: [
      {
        name: 'tokenX',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenY',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'binStep',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__SenderIsNotWNATIVE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LBRouter__SwapOverflows',
    inputs: [
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__TooMuchTokensIn',
    inputs: [
      {
        name: 'excess',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__WrongAmounts',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'reserve',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__WrongNativeLiquidityParameters',
    inputs: [
      {
        name: 'tokenX',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenY',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountX',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountY',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'msgValue',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'LBRouter__WrongTokenOrder',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PackedUint128Math__SubUnderflow',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TokenHelper__TransferFailed',
    inputs: [],
  },
] as const
