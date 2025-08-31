import { logger, normalizeHexData } from '@evm-tt/utils'
import { hexToString } from 'viem/utils'
import createTask from '../../program'
import { parseHex } from './to-asci'

createTask('to-utf8')
  .description('Convert hex data to a utf-8 string')
  .aliases(['tu8', '2u8'])
  .argument('<hexdata>', 'Hex data (0x-optional)', parseHex)
  .action((hexData) => {
    logger.default(hexToString(normalizeHexData(hexData)))
  })
