import { bigintFromBase, bigintToBase, logger, parseRadix } from '@evm-tt/utils'
import { type Hex } from 'viem'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

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
