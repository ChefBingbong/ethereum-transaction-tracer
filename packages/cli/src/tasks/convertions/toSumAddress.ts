import { InvalidArgumentError } from '@commander-js/extra-typings'
import { logger, zAddress } from '@evm-tt/utils'
import { type Address, getAddress } from 'viem'
import z from 'zod'
import createTask from '../../program'

export const parseUnit = (value: string): number => {
  const schema = z.coerce.number(value)
  const out = schema.safeParse(value.toLowerCase())
  if (!out.success) throw new InvalidArgumentError(`Invalid value ${value}`)
  return out.data
}
export const parseAddress = (value: string): Address => {
  const out = zAddress.safeParse(value)
  if (!out.success) throw new InvalidArgumentError(`Invalid value ${value}`)
  return out.data
}

createTask('to-check-sum-address')
  .description('Convert an address to EIP-55 checksummed format')
  .aliases(['to-checksum-address', 'to-checksum', 'ta', '2a'])
  .argument('<address>', 'Ethereum address (0x...)', parseAddress)
  .action((address) => {
    logger.default(getAddress(String(address)))
  })
