import { bigintFromBase, bigintToBase, logger, parseRadix } from '@evm-tt/utils'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

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
