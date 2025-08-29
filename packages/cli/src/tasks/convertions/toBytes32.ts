import { logger, normalizeHexData } from '@evm-tt/utils'
import { hexToBytes, pad } from 'viem'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

createTask('to-bytes32')
  .description('Right-pads hex data to 32 bytes')
  .aliases(['tb', '2b'])
  .requiredOption('--hex <hexdata>', 'Hex data (0x-optional)')
  .action((opts) => {
    try {
      const hex = normalizeHexData(opts.hex)
      if (hexToBytes(hex).length > 32) throw new Error('too long')
      const padded = pad(hex, { size: 32, dir: 'right' })
      logger.default(padded)
    } catch {
      fail('to-bytes32')
    }
  })
