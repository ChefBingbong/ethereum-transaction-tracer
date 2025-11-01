import { InvalidArgumentError } from '@commander-js/extra-typings'
import { logger } from '@evm-tt/utils'
import { parseUnits } from 'viem'
import z from 'zod'
import createTask from '../../program'

export type Unit = 'ether' | 'gwei' | 'wei' | '6'

export const validateUnits = (unit?: string): Unit => {
  const safeParsed = z.safeParse(z.enum(['gwei', 'wei', 'ether']), unit)
  if (safeParsed.error || !safeParsed.data) {
    throw new InvalidArgumentError('fail')
  }
  return safeParsed.data
}

createTask('to-wei')
  .description('Convert an ETH amount to wei (default from ether)')
  .argument('<amount>', 'Amount to convert', Number.parseInt)
  .argument(
    '[fromUnit]',
    'ether | gwei | wei (default: ether)',
    validateUnits,
    'ether',
  )
  .action((amount: number, _fromUnit: Unit) => {
    // const unit = (fromUnit ?? 'ether').toLowerCase()
    const decimals = 18
    const wei = parseUnits(String(amount), decimals)
    logger.default(wei.toString())
  })
