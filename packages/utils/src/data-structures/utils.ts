import type { Address } from 'viem'

export const isSameAddress = (address1: Address, address2: Address): boolean =>
  address1.toLowerCase() === address2.toLowerCase()

export const toLowerCaseAddress = (address: Address) => address.toLowerCase() as Address
