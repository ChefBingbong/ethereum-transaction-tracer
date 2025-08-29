import { logger, normalizeHexData } from '@evm-tt/utils'
import { hexToString } from 'viem'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

createTask('to-utf8')
  .description('Convert hex data to a utf-8 string')
  .aliases(['tu8', '2u8'])
  .requiredOption('--hex <hexdata>', 'Hex data (0x-optional)')
  .action((opts) => {
    try {
      logger.default(hexToString(normalizeHexData(opts.hex)))
    } catch {
      fail('to-utf8')
    }
  })
