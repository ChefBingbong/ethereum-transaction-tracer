import { InvalidArgumentError } from '@commander-js/extra-typings'
import { logger, normalizeHexData, zHex } from '@evm-tt/utils'
import { type Hex, hexToBytes } from 'viem'
import createTask from '../../program'

export const parseHex = (value: string): Hex => {
  const out = zHex.safeParse(value)
  if (!value.startsWith('0x'))
    throw new InvalidArgumentError(`Invalid value Hex should start wih 0x`)
  if (!out.success) throw new InvalidArgumentError(`Invalid value ${value}`)
  return out.data
}

createTask('to-ascii')
  .description('Convert hex data to an ASCII string')
  .aliases(['tas', '2as'])
  .argument('<hexdata>', 'Hex data (0x...)', parseHex)
  .action((hexData) => {
    const hex = normalizeHexData(hexData)
    const bytes = hexToBytes(hex)
    let out = ''
    for (const b of bytes) out += String.fromCharCode(b)
    logger.default(out)
  })
