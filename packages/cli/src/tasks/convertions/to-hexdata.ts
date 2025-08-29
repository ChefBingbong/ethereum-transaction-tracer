import { logger, normalizeHexData } from '@evm-tt/utils'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

createTask('to-hexdata')
  .description('Normalize input to lowercase, 0x-prefixed hex')
  .aliases(['thd', '2hd'])
  .requiredOption('--data <hexdata>', 'Hex data (0x-optional)')
  .action((opts) => {
    try {
      logger.default(normalizeHexData(opts.data))
    } catch {
      fail('to-hexdata')
    }
  })
