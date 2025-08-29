import { logger } from '@evm-tt/utils'
import { getAddress } from 'viem'
import createTask from '../../program'
import { parseAddress } from './toUint'

createTask('to-check-sum-address')
  .description('Convert an address to EIP-55 checksummed format')
  .aliases(['to-checksum-address', 'to-checksum', 'ta', '2a'])
  .argument('<address>', 'Ethereum address (0x...)', parseAddress)
  .action((address) => {
    logger.default(getAddress(String(address)))
  })
