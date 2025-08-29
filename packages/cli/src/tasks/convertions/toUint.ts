import { InvalidArgumentError } from '@commander-js/extra-typings'
import { logger, unitsToDecimals, zAddress } from '@evm-tt/utils'
import { type Address, formatUnits, parseUnits } from 'viem'
import z from 'zod'
import createTask from '../../program'
import { validateUnits } from './toWei'

const parseUnit = (value: string): number => {
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
createTask('to-unit')
  .description('Convert an ETH amount into another unit (ether, gwei or wei)')
  .aliases(['tun', '2un'])
  .argument('<amount>', 'Amount in the source unit', parseUnit)
  .argument('[unit]', 'wei | gwei | ether', validateUnits)
  .argument('<unit>', 'wei | gwei | ether', validateUnits)
  .action((amount, from, to) => {
    const fromDec = unitsToDecimals(String(from))
    const toDec = unitsToDecimals(String(to))
    const wei = parseUnits(String(amount), fromDec)
    const out = formatUnits(wei, toDec)
    logger.default(out)
  })
