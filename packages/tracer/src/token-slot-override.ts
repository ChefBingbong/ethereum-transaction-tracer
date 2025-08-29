import {
  type Address,
  concat,
  encodePacked,
  type Hex,
  hexToBigInt,
  keccak256,
  maxUint128,
  numberToHex,
  pad,
} from 'viem'

function getStandardBalanceSlot(address: Address, slot: bigint): Hex {
  return keccak256(
    encodePacked(['bytes32', 'uint256'], [pad(address, { size: 32 }), slot]),
  )
}

function getStandardAllowanceSlot(
  owner: Address,
  recipient: Address,
  slot: bigint,
): Hex {
  return keccak256(
    encodePacked(
      ['bytes32', 'bytes32'],
      [
        pad(recipient, { size: 32 }),
        keccak256(
          encodePacked(
            ['bytes32', 'uint256'],
            [pad(owner, { size: 32 }), slot],
          ),
        ),
      ],
    ),
  )
}

function getCustomSlotWithAddress(address: Address, baseSlot: Hex): Hex {
  return keccak256(
    encodePacked(
      ['bytes32', 'bytes32'],
      [pad(address, { size: 32 }), baseSlot],
    ),
  )
}

function getSlotForSoladyErc20Approval(owner: Address, recipient: Address) {
  const APPROVE_SLOT_SEED: Hex = '0x7f5e9f20'
  const body = concat([owner, pad(APPROVE_SLOT_SEED, { size: 12 }), recipient])
  return keccak256(body)
}

function getSlotForSoladyErc20Balance(owner: Address) {
  const BALANCE_SLOT_SEED: Hex = '0x87a211a2'
  const body = concat([owner, pad(BALANCE_SLOT_SEED, { size: 12 })])
  return keccak256(body)
}

function getSlotForOZERC20Balance(address: Address) {
  return getStandardBalanceSlot(address, 0n)
}

function getSlotForOZERC20BalanceWithOwner(address: Address) {
  return getStandardBalanceSlot(address, 1n)
}

function getSlotForUSDCBalance(address: Address) {
  return getStandardBalanceSlot(address, 9n)
}

function getSlotForWBTCBalance(address: Address) {
  return getStandardBalanceSlot(address, 5n)
}

function getSlotForUSDT0Balance(address: Address) {
  return getStandardBalanceSlot(address, 51n)
}

function getSlotForWHYPEBalance(address: Address) {
  return getStandardBalanceSlot(address, 3n)
}

function getSlotForOZERC20Allowance(owner: Address, recipient: Address) {
  return getStandardAllowanceSlot(owner, recipient, 1n)
}

function getSlotForOZERC20AllowanceWithOwner(
  owner: Address,
  recipient: Address,
) {
  return getStandardAllowanceSlot(owner, recipient, 2n)
}

function getSlotForUSDCAllowance(owner: Address, recipient: Address) {
  return getStandardAllowanceSlot(owner, recipient, 10n)
}

function getSlotForWBTCAllowance(owner: Address, recipient: Address) {
  return getStandardAllowanceSlot(owner, recipient, 6n)
}

function getSlotForUSDT0Allowance(owner: Address, recipient: Address) {
  return getStandardAllowanceSlot(owner, recipient, 52n)
}

function getSlotForWHYPEAllowance(owner: Address, recipient: Address) {
  return getStandardAllowanceSlot(owner, recipient, 4n)
}

function getSlotForOZUpERC20Balance(address: Address) {
  const baseSlot: Hex =
    '0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00'
  return getCustomSlotWithAddress(address, baseSlot)
}

function getSlotForOZUpERC20Allowance(owner: Address, recipient: Address) {
  const baseSlot =
    hexToBigInt(
      '0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00',
    ) + 1n
  return getStandardAllowanceSlot(owner, recipient, baseSlot)
}

function getSlotForIBGTBalance(address: Address) {
  return getStandardBalanceSlot(address, 2n)
}

function getSlotForIBGTAllowance(owner: Address, recipient: Address) {
  return getStandardAllowanceSlot(owner, recipient, 3n)
}

const maxInt256 = (1n << 255n) - 1n

export function getUnlimitedBalanceAndApprovalStateOverrides(
  owner: Address,
  token: Address,
  approvalRecipient: Address,
  opts: {
    balance?: bigint
    allowance?: bigint
    standardBalanceSlotIndex?: bigint
    standardAllowanceSlotIndex?: bigint
  } = {},
) {
  const {
    balance = maxUint128 - 1n,
    allowance = maxUint128 - 1n,
    standardAllowanceSlotIndex = 4n,
  } = opts

  const balHex = numberToHex(balance, { size: 32 })
  const allHex = numberToHex(allowance, { size: 32 })

  const stateDiff: Record<Hex, Hex> = {
    [getSlotForWHYPEBalance(owner)]: balHex,
    [getStandardAllowanceSlot(
      owner,
      approvalRecipient,
      standardAllowanceSlotIndex,
    )]: allHex,

    [getSlotForWHYPEAllowance(owner, approvalRecipient)]: allHex,
    [getSlotForSoladyErc20Approval(owner, approvalRecipient)]: allHex,
    [getSlotForSoladyErc20Balance(owner)]: balHex,
    [getSlotForOZERC20Allowance(owner, approvalRecipient)]: allHex,
    [getSlotForOZERC20Balance(owner)]: balHex,
    [getSlotForOZERC20AllowanceWithOwner(owner, approvalRecipient)]: allHex,
    [getSlotForOZERC20BalanceWithOwner(owner)]: balHex,
    [getSlotForWBTCBalance(owner)]: balHex,
    [getSlotForWBTCAllowance(owner, approvalRecipient)]: allHex,
    [getSlotForOZUpERC20Allowance(owner, approvalRecipient)]: allHex,
    [getSlotForOZUpERC20Balance(owner)]: balHex,
    [getSlotForUSDCAllowance(owner, approvalRecipient)]: allHex,
    [getSlotForUSDCBalance(owner)]: numberToHex(maxInt256, { size: 32 }),
    [getSlotForUSDT0Balance(owner)]: balHex,
    [getSlotForUSDT0Allowance(owner, approvalRecipient)]: allHex,
    [getSlotForIBGTBalance(owner)]: balHex,
    [getSlotForIBGTAllowance(owner, approvalRecipient)]: allHex,
  }

  return {
    [owner]: {
      balance,
    },
    [token]: {
      stateDiff,
    },
  }
}
