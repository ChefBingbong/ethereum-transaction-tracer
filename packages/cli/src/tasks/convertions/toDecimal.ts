import { bigintFromBase, logger, parseRadix } from '@evm-tt/utils'
import createTask from '../../program'

const fail = (task: string) => {
  logger.default(`${task} failed unexpectedly`)
  process.exit(1)
}

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
