import { InvalidArgumentError } from '@commander-js/extra-typings'
import { logger, parseBigIntFlexible } from '@evm-tt/utils'
import { toHex } from 'viem'
import z from 'zod'
import createTask from '../../program'

const parseUnit = (value: string): number => {
  const schema = z.coerce.number(value)
  const out = schema.safeParse((value ?? '').toLowerCase())
  if (!out.success) throw new InvalidArgumentError(`Invalid value ${value}`)
  return out.data
}

createTask('to-uint256')
  .description('Convert a number to a hex-encoded uint256')
  .aliases(['tu', '2u'])
  .argument('<value>', 'Decimal or 0x-hex (non-negative)', parseUnit)
  .action((value) => {
    const n = parseBigIntFlexible(String(value))
    logger.default(toHex(n, { size: 32 }))
  })
