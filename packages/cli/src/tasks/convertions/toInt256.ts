import { logger, parseBigIntFlexible } from '@evm-tt/utils'
import { toHex } from 'viem'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

createTask('to-int256')
  .description('Convert a number to a hex-encoded int256')
  .aliases(['ti', '2i'])
  .requiredOption('--value <value>', 'Decimal or 0x-hex (can be negative)')
  .action((opts) => {
    try {
      const n = parseBigIntFlexible(String(opts.value))
      logger.default(toHex(n, { size: 32 }))
    } catch {
      fail('to-int256')
    }
  })
