import { logger, normalizeHexData } from '@evm-tt/utils'
import { hexToBytes } from 'viem'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

createTask('to-ascii')
  .description('Convert hex data to an ASCII string')
  .aliases(['tas', '2as'])
  .argument('--hex <hexdata>', 'Hex data (0x-optional)')
  .action((opts) => {
    try {
      const hex = normalizeHexData(opts)
      const bytes = hexToBytes(hex)
      let out = ''
      for (const b of bytes) out += String.fromCharCode(b)
      logger.default(out)
    } catch {
      fail('to-ascii')
    }
  })
