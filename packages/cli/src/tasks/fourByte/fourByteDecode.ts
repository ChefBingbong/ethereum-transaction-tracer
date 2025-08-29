import { getAbiItemFromDelector, TracerCache } from '@evm-tt/tracer'
import {
  formatArgsInline,
  logger,
  normalizeHex,
  safeDecodeFunctionData,
} from '@evm-tt/utils'
import { toFunctionSignature } from 'viem'
import { getConfigDir } from '../../configCli/env'
import createTask from '../../program'

createTask('4byte-decode')
  .description('Decode ABI-encoded calldata using')
  .alias('4db')
  .requiredOption('--calldata <calldata_hex>', 'ABI-encoded calldata (Hex)')
  .action(async (opts, program) => {
    const callData = normalizeHex(opts.calldata)
    const selector = normalizeHex(callData.slice(0, 10))

    const cache = new TracerCache(1, getConfigDir())
    const [, abi] = await getAbiItemFromDelector(selector, cache)
    const [, decoded] = safeDecodeFunctionData(abi, callData)

    if (abi && decoded) {
      logger.default(`\n${toFunctionSignature(abi as any)}`)
      logger.default(`\n${decoded.args.map(formatArgsInline).join(', \n')}`)
      return
    }
    program.error('\nunable to decode function calldata')
  })
