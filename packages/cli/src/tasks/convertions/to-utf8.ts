import { logger, normalizeHexData } from '@evm-tt/utils'
import { hexToString } from 'viem/utils'
import createTask from '../../program'
import { parseHex } from './to-asci'

createTask('to-hexdata')
  .description('Normalize input to lowercase, 0x-prefixed hex')
  .aliases(['thd', '2hd'])
  .argument('<hexdata>', 'Hex data (0x-optional)', parseHex)
  .action((hexData) => {
    logger.default(hexToString(normalizeHexData(hexData)))
  })
