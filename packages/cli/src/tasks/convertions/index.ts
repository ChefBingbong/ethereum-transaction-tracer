import {
  bigintFromBase,
  bigintToBase,
  logger,
  normalizeHexData,
  parseBigIntFlexible,
  parseRadix,
  unitsToDecimals,
} from '@evm-tt/utils'
import {
  formatUnits,
  getAddress,
  type Hex,
  hexToBytes,
  hexToString,
  pad,
  parseUnits,
  toHex,
  toRlp,
} from 'viem'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

createTask('to-ascii')
  .description('Convert hex data to an ASCII string')
  .aliases(['tas', '2as'])
  .requiredOption('--hex <hexdata>', 'Hex data (0x-optional)')
  .action((opts) => {
    try {
      const hex = normalizeHexData(opts.hex)
      const bytes = hexToBytes(hex)
      let out = ''
      for (const b of bytes) out += String.fromCharCode(b)
      logger.default(out)
    } catch {
      fail('to-ascii')
    }
  })

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

createTask('to-check-sum-address')
  .description('Convert an address to EIP-55 checksummed format')
  .aliases(['to-checksum-address', 'to-checksum', 'ta', '2a'])
  .requiredOption('--address <address>', 'Ethereum address (0x...)')
  .action((opts) => {
    try {
      logger.default(getAddress(String(opts.address)))
    } catch {
      fail('to-check-sum-address')
    }
  })

createTask('to-base')
  .description('Convert a number from one base to another')
  .aliases(['to-radix', 'tr', '2r'])
  .requiredOption('--value <value>', 'Input value (no prefixes)')
  .requiredOption('--from <base>', 'Input base (2..36)')
  .requiredOption('--to <base>', 'Output base (2..36)')
  .action((opts) => {
    try {
      const from = parseRadix(String(opts.from))
      const to = parseRadix(String(opts.to))
      const n = bigintFromBase(String(opts.value), from)
      logger.default(bigintToBase(n, to))
    } catch {
      fail('to-base')
    }
  })

createTask('to-dec')
  .description('Convert a number of one base to decimal')
  .aliases(['td', '2d'])
  .requiredOption('--value <value>', 'Input value (no prefixes)')
  .requiredOption('--from <base>', 'Input base (2..36)')
  .action((opts) => {
    try {
      const from = parseRadix(String(opts.from))
      const n = bigintFromBase(String(opts.value), from)
      logger.default(n.toString(10))
    } catch {
      fail('to-dec')
    }
  })

createTask('to-hex')
  .description('Convert a number of one base to hex (0x-prefixed)')
  .aliases(['th', '2h'])
  .requiredOption('--value <value>', 'Input value (no prefixes)')
  .option('--from <base>', 'Input base (2..36). Default 10', '10')
  .action((opts) => {
    try {
      const from = parseRadix(String(opts.from ?? '10'))
      const n = bigintFromBase(String(opts.value), from)
      let hex = n < 0n ? `-${bigintToBase(-n, 16)}` : bigintToBase(n, 16)
      if (!hex.startsWith('-') && hex.length % 2) hex = `0${hex}`
      if (hex.startsWith('-')) logger.default(`-0x${hex.slice(1)}`)
      else logger.default(`0x${hex}` as Hex)
    } catch {
      fail('to-hex')
    }
  })

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

createTask('to-uint256')
  .description('Convert a number to a hex-encoded uint256')
  .aliases(['tu', '2u'])
  .requiredOption('--value <value>', 'Decimal or 0x-hex (non-negative)')
  .action((opts) => {
    try {
      const n = parseBigIntFlexible(String(opts.value))
      if (n < 0n) throw new Error('neg')
      logger.default(toHex(n, { size: 32 }))
    } catch {
      fail('to-uint256')
    }
  })

createTask('to-rlp')
  .description('RLP encodes hex data, or an array of hex data')
  .requiredOption('--values <hex|csv|json>', 'Single hex, comma list, or JSON array')
  .action((opts) => {
    try {
      const raw = String(opts.values).trim()
      let value: Hex | Hex[] | (Hex | Hex[])[]
      if (raw.startsWith('[')) {
        const arr = JSON.parse(raw) as string[]
        value = arr.map((x) => normalizeHexData(x))
      } else if (raw.includes(',')) {
        value = raw.split(',').map((x) => normalizeHexData(x))
      } else {
        value = normalizeHexData(raw)
      }
      const out = toRlp(value)
      logger.default(out)
    } catch {
      fail('to-rlp')
    }
  })

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

createTask('to-unit')
  .description('Convert an ETH amount into another unit (ether, gwei or wei)')
  .aliases(['tun', '2un'])
  .requiredOption('--value <amount>', 'Amount in the source unit')
  .requiredOption('--from <unit>', 'wei | gwei | ether')
  .requiredOption('--to <unit>', 'wei | gwei | ether')
  .action((opts) => {
    try {
      const fromDec = unitsToDecimals(String(opts.from))
      const toDec = unitsToDecimals(String(opts.to))
      const wei = parseUnits(String(opts.value), fromDec)
      const out = formatUnits(wei, toDec)
      logger.default(out)
    } catch {
      fail('to-unit')
    }
  })

// ---------- to-wei ----------
createTask('to-wei')
  .description('Convert an ETH amount to wei (default from ether)')
  .requiredOption('--value <amount>', 'Amount to convert')
  .option('--from <unit>', 'ether | gwei | wei (default: ether)', 'ether')
  .action((opts) => {
    try {
      const fromDec = unitsToDecimals(String(opts.from ?? 'ether'))
      const wei = parseUnits(String(opts.value), fromDec)
      logger.default(wei.toString())
    } catch {
      fail('to-wei')
    }
  })
