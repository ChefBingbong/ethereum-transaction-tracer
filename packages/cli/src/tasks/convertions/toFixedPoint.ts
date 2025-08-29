import { logger, parseBigIntFlexible } from '@evm-tt/utils'
import { formatUnits } from 'viem'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

createTask('to-fixed-point')
  .description('Convert an integer into a fixed point number with given decimals')
  .aliases(['to-fix', 'tf', '2f'])
  .requiredOption('--value <int>', 'Integer amount (wei-like integer)')
  .requiredOption('--decimals <n>', 'Number of decimals', '18')
  .action((opts) => {
    try {
      const value = parseBigIntFlexible(String(opts.value))
      const decimals = Number(opts.decimals)
      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 256)
        throw new Error('decimals out of range')
      logger.default(formatUnits(value, decimals))
    } catch {
      fail('to-fixed-point')
    }
  })
