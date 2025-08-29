import { logger, safeSyncTry } from '@evm-tt/utils'
import { encodeFunctionData, parseAbiItem } from 'viem'
import createTask from '../../program'

createTask('encode-abi')
  .description('Encode ABI from sunction signature')
  .alias('casae')
  .requiredOption(
    '-s --sig <signature_string>',
    'Function signature MyFunc(uint256,address)',
  )
  .requiredOption('-a --args <args_array>', 'Function arguments')
  .action(async (opts, program) => {
    const { args, sig } = opts

    const functionName = sig.split('(')[0]
    const selector = `function ${sig}`
    const abiItem = parseAbiItem(selector)

    const [_, encoded] = safeSyncTry(() =>
      encodeFunctionData({
        abi: [abiItem],
        functionName,
        args: args.split(','),
      }),
    )

    if (encoded) logger.default(`0x${encoded.slice(10)}`)
    else program.error('\nunable to decode function calldata')
  })
